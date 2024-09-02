import {
  type EventHandler,
  type Message,
  type PubSub,
  type SignedMessage,
  type StreamHandler,
  type SubscriptionChangeData,
  TypedEventEmitter,
} from '@libp2p/interface'
import { PeerSet } from '@libp2p/peer-collections'
import { pipe } from 'it-pipe'
import PQueue from 'p-queue'
import { TimeoutController } from 'timeout-abort-controller'

import { SYNC_PROTOCOL, SYNC_TIMEOUT } from './constants'
import { join } from './utils'

import type { EntryInstance } from './oplog/entry'
import type { LogInstance } from './oplog/log'
import type { HeliaInstance, PeerId } from './vendor'
import type { GossipsubEvents } from '@chainsafe/libp2p-gossipsub'
import type { Source } from 'it-stream-types'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface SyncEvents<T> {
  join: CustomEvent<{ peerId: PeerId, heads: EntryInstance<T>[] }>
  leave: CustomEvent<{ peerId: PeerId }>
  error: ErrorEvent
}

export interface SyncOptions<T> {
  ipfs: HeliaInstance
  log: LogInstance<T>
  events?: TypedEventEmitter<SyncEvents<T>>
  start?: boolean
  timestamp?: number
  timeout?: number
  onSynced?: (bytes: Uint8Array) => Promise<void>
}

export interface SyncInstance<T, E extends SyncEvents<T>> {
  peers: PeerSet
  events: TypedEventEmitter<E>

  start: () => Promise<void>
  stop: () => Promise<void>
  add: <D = T>(entry: EntryInstance<D>) => Promise<void>
}

export class Sync<T, E extends SyncEvents<T> = SyncEvents<T>>
implements SyncInstance<T, E> {
  private ipfs: HeliaInstance
  private pubsub: PubSub<GossipsubEvents>
  private log: LogInstance<T>
  private onSynced?: (bytes: Uint8Array) => Promise<void>
  private timeout: number
  private queue: PQueue
  private started: boolean
  private address: string
  private headsSyncAddress: string

  public events: TypedEventEmitter<E>
  public peers: PeerSet

  private constructor(options: SyncOptions<T>) {
    this.ipfs = options.ipfs
    this.pubsub = options.ipfs.libp2p.services.pubsub
    this.log = options.log
    this.onSynced = options.onSynced
    this.events = options.events || new TypedEventEmitter<E>()
    this.peers = new PeerSet()
    this.queue = new PQueue({ concurrency: 1 })
    this.started = false
    this.address = this.log.id
    this.timeout = options.timeout || SYNC_TIMEOUT
    this.headsSyncAddress = join(SYNC_PROTOCOL, this.address)
  }

  public static async create<T>(options: SyncOptions<T>) {
    const sync = new Sync(options)

    if (options.start !== false) {
      await sync
        .start()
        .catch(error =>
          sync.events.dispatchEvent(
            new CustomEvent('error', { detail: { error } }),
          ),
        )
    }

    return sync
  }

  private async onPeerJoined(peerId: PeerId): Promise<void> {
    const heads = await this.log.heads()
    this.events.dispatchEvent(
      new CustomEvent('join', { detail: { peerId, heads } }),
    )
  }

  private async *headsIterator(): AsyncGenerator<Uint8Array> {
    const heads = await this.log.heads()
    for await (const { bytes } of heads) {
      yield bytes!
    }
  }

  private async receiveHeads(
    peerId: PeerId,
    source: Source<Uint8ArrayList>,
  ) {
    for await (const value of source) {
      const headBytes = value.subarray()
      if (headBytes && this.onSynced) {
        await this.onSynced(headBytes)
      }
    }

    if (this.started) {
      await this.onPeerJoined(peerId)
    }
  }

  private handleReceiveHeads: StreamHandler = async ({
    connection,
    stream,
  }) => {
    const peerId = connection.remotePeer
    try {
      this.peers.add(peerId)

      await pipe(
        stream,
        source => this.receiveHeads(peerId, source),
        () => this.headsIterator(),
        stream,
      )
    }
    catch (error) {
      this.peers.delete(peerId)
      this.events.dispatchEvent(
        new CustomEvent('error', { detail: { error } }),
      )
    }
  }

  private handlePeerSubscribed: EventHandler<
    CustomEvent<SubscriptionChangeData>
  > = async (event) => {
      const task = async () => {
        const { peerId: remotePeer, subscriptions } = event.detail
        const peerId = remotePeer

        const subscription = subscriptions.find(
          (e: any) => e.topic === this.address,
        )
        if (!subscription) {
          return
        }

        if (subscription.subscribe) {
          if (this.peers.has(peerId)) {
            return
          }

          const timeoutController = new TimeoutController(this.timeout)
          const { signal } = timeoutController
          try {
            this.peers.add(peerId)
            const stream = await this.ipfs.libp2p.dialProtocol(
              remotePeer,
              this.headsSyncAddress,
              { signal },
            )

            pipe(
              () => this.headsIterator(),
              stream,
              source => this.receiveHeads(peerId, source),
            )
          }
          catch (error: any) {
            this.peers.delete(peerId)
            if (error.code !== 'ERR_UNSUPPORTED_PROTOCOL') {
              this.events.dispatchEvent(
                new CustomEvent('error', { detail: { error } }),
              )
            }
          }
          finally {
            timeoutController.clear()
          }
        }
        else {
          this.peers.delete(peerId)
          this.events.dispatchEvent(
            new CustomEvent('leave', { detail: { peerId } }),
          )
        }
      }

      await this.queue.add(task)
    }

  private handleUpdateMessage: EventHandler<CustomEvent<Message>> = async (
    message,
  ) => {
    const { topic, data, from } = message.detail as SignedMessage

    const task = async () => {
      try {
        if (from && data && this.onSynced) {
          await this.onSynced(data)
        }
      }
      catch (error) {
        this.events.dispatchEvent(
          new CustomEvent('error', { detail: { error } }),
        )
      }
    }

    if (topic === this.address) {
      this.queue.add(task)
    }
  }

  public async start(): Promise<void> {
    if (!this.started) {
      await this.ipfs.libp2p.handle(
        this.headsSyncAddress,
        this.handleReceiveHeads,
      )
      this.pubsub.addEventListener(
        'subscription-change',
        this.handlePeerSubscribed,
      )
      this.pubsub.addEventListener('message', this.handleUpdateMessage)
      await Promise.resolve(this.pubsub.subscribe(this.address))

      this.started = true
    }
  }

  public async stop(): Promise<void> {
    if (this.started) {
      this.started = false
      await this.queue.onIdle()

      this.pubsub.removeEventListener(
        'subscription-change',
        this.handlePeerSubscribed,
      )
      this.pubsub.removeEventListener('message', this.handleUpdateMessage)

      await this.ipfs.libp2p.unhandle(this.headsSyncAddress)
      await Promise.resolve(this.pubsub.unsubscribe(this.address))

      this.peers.clear()
    }
  }

  public async add<D = T>(entry: EntryInstance<D>): Promise<void> {
    if (this.started && entry.bytes) {
      await this.pubsub.publish(this.address, entry.bytes)
    }
  }
}
