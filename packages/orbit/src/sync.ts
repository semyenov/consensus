import {
  type EventHandler,
  type Message,
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
import type { Sink, Source } from 'it-stream-types'
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
  onSynced?: (head: Uint8Array) => Promise<void>
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
  private log: LogInstance<T>
  private onSynced?: (bytes: Uint8Array) => Promise<void>
  private timeout: number
  private queue: PQueue
  private started: boolean
  private address: string
  private headsSyncAddress: string

  public events: TypedEventEmitter<E>
  public peers: PeerSet

  constructor(options: SyncOptions<T>) {
    this.ipfs = options.ipfs
    this.log = options.log
    this.onSynced = options.onSynced
    this.timeout = options.timeout || SYNC_TIMEOUT
    this.events = options.events || new TypedEventEmitter<E>()
    this.peers = new PeerSet()
    this.queue = new PQueue({ concurrency: 1 })
    this.started = false
    this.address = this.log.id
    this.headsSyncAddress = join(SYNC_PROTOCOL, this.address)

    if (options.start !== false) {
      this.start()
        .catch(error => this.events.dispatchEvent(new ErrorEvent('error', { error })),
        )
    }
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

  private sendHeads(): () => Source<Uint8Array> {
    return () => this.headsIterator()
  }

  private receiveHeads(
    peerId: PeerId,
  ): Sink<AsyncIterable<Uint8ArrayList>, void> {
    return async (source) => {
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
  }

  private handleReceiveHeads: StreamHandler = async ({
    connection,
    stream,
  }) => {
    const peerId = connection.remotePeer
    try {
      this.peers.add(peerId)
      await pipe(stream, this.receiveHeads(peerId), this.sendHeads(), stream)
    }
    catch (error) {
      this.peers.delete(peerId)
      console.error('error', error)
      this.events.dispatchEvent(new ErrorEvent('error', { error }))
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
            pipe(this.sendHeads(), stream, this.receiveHeads(peerId))
          }
          catch (error: any) {
            console.error(error)
            this.peers.delete(peerId)
            if (error.code !== 'ERR_UNSUPPORTED_PROTOCOL') {
              this.events.dispatchEvent(new ErrorEvent('error', { error }))
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

      this.queue.add(task)
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
        console.error('error 123', error)
        this.events.dispatchEvent(new ErrorEvent('error', { error }))
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
      this.ipfs.libp2p.services.pubsub.addEventListener(
        'subscription-change',
        this.handlePeerSubscribed,
      )
      this.ipfs.libp2p.services.pubsub.addEventListener(
        'message',
        this.handleUpdateMessage,
      )
      await Promise.resolve(
        this.ipfs.libp2p.services.pubsub.subscribe(this.address),
      )

      this.started = true
    }
  }

  public async stop(): Promise<void> {
    if (this.started) {
      this.started = false
      await this.queue.onIdle()
      this.ipfs.libp2p.services.pubsub.removeEventListener(
        'subscription-change',
        this.handlePeerSubscribed,
      )
      this.ipfs.libp2p.services.pubsub.removeEventListener(
        'message',
        this.handleUpdateMessage,
      )
      await this.ipfs.libp2p.unhandle(this.headsSyncAddress)
      await Promise.resolve(
        this.ipfs.libp2p.services.pubsub.unsubscribe(this.address),
      )
      this.peers.clear()
    }
  }

  public async add<D = T>(entry: EntryInstance<D>): Promise<void> {
    if (this.started) {
      await this.ipfs.libp2p.services.pubsub.publish(this.address, entry.bytes!)
    }
  }
}
