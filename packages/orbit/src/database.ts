/* eslint-disable no-unused-vars */
import { TypedEventEmitter } from '@libp2p/interface'
import PQueue from 'p-queue'

import {
  DATABASE_CACHE_SIZE,
  DATABASE_PATH,
  DATABASE_REFERENCES_COUNT,
  HEADS_PATH,
  INDEX_PATH,
} from './constants'
import { Entry, Log } from './oplog/index'
import {
  ComposedStorage,
  IPFSBlockStorage,
  LRUStorage,
  LevelStorage,
  type StorageInstance,
} from './storage/index'
import { Sync, type SyncEvents, type SyncInstance } from './sync'
import { join } from './utils'

import type { AccessControllerInstance } from './access-controllers'
import type { DatabaseOperation } from './databases/index'
import type { IdentitiesInstance, IdentityInstance } from './identities/index'
import type { EntryInstance } from './oplog/entry'
import type { LogInstance } from './oplog/log'
import type { HeliaInstance, PeerId } from './vendor'
import type { PeerSet } from '@libp2p/peer-collections'

// Type Definitions
export type DatabaseOptionsOnUpdate<T> = (
  log: LogInstance<DatabaseOperation<T>>,
  entry: EntryInstance<T> | EntryInstance<DatabaseOperation<T>>,
) => Promise<void>

export interface DatabaseOptions<T> {
  meta?: any
  name?: string
  address?: string
  directory?: string
  referencesCount?: number
  syncAutomatically?: boolean
  ipfs: HeliaInstance
  identity?: IdentityInstance
  identities?: IdentitiesInstance
  headsStorage?: StorageInstance<Uint8Array>
  entryStorage?: StorageInstance<Uint8Array>
  indexStorage?: StorageInstance<boolean>
  accessController?: AccessControllerInstance
  onUpdate?: DatabaseOptionsOnUpdate<T>
}

export interface DatabaseEvents<T = unknown> {
  join: CustomEvent<{ peerId: PeerId, heads: EntryInstance<T>[] }>
  leave: CustomEvent<{ peerId: PeerId }>
  close: CustomEvent
  drop: CustomEvent
  error: CustomEvent<Error>
  update: CustomEvent<{ entry: EntryInstance<DatabaseOperation<T>> }>
}

export interface DatabaseInstance<
  T,
  E extends DatabaseEvents<T> = DatabaseEvents<T>,
> {
  name?: string
  address?: string
  indexBy?: string
  peers: PeerSet
  meta: any
  log: LogInstance<DatabaseOperation<T>>
  sync: SyncInstance<DatabaseOperation<T>, SyncEvents<DatabaseOperation<T>>>
  events: TypedEventEmitter<E>
  identity: IdentityInstance
  accessController: AccessControllerInstance
  addOperation: <D = T>(op: DatabaseOperation<D>) => Promise<string>
  close: () => Promise<void>
  drop: () => Promise<void>
}

// Database Class
export class Database<
  T = unknown,
  E extends DatabaseEvents<T> = DatabaseEvents<T> & SyncEvents<T>,
> implements DatabaseInstance<T, E> {
  public name?: string
  public address?: string
  public indexBy?: string
  public peers: PeerSet
  public meta: any
  public log: LogInstance<DatabaseOperation<T>>
  public sync: SyncInstance<
    DatabaseOperation<T>,
    SyncEvents<DatabaseOperation<T>>
  >

  public events: TypedEventEmitter<E>
  public identity: IdentityInstance
  public accessController: AccessControllerInstance

  private queue: PQueue
  private writeQueue: PQueue
  private batchSize: number
  private onUpdate?: DatabaseOptionsOnUpdate<T>

  private constructor(
    log: LogInstance<DatabaseOperation<T>>,
    sync: SyncInstance<DatabaseOperation<T>, SyncEvents<DatabaseOperation<T>>>,
    events: TypedEventEmitter<E>,
    queue: PQueue,
    writeQueue: PQueue,
    identity: IdentityInstance,
    name?: string,
    address?: string,
    meta?: any,
    onUpdate?: DatabaseOptionsOnUpdate<T>,
  ) {
    this.meta = meta
    this.name = name
    this.batchSize = 100 // Adjust this value based on your needs
    this.address = address
    this.identity = identity

    this.accessController = log.accessController
    this.onUpdate = onUpdate
    this.events = events
    this.queue = queue
    this.writeQueue = writeQueue

    this.log = log

    this.sync = sync
    this.peers = sync.peers
  }

  static async create<T>(options: DatabaseOptions<T>) {
    const {
      name,
      meta,
      address,
      ipfs,
      onUpdate,
      directory,
      identity,
      accessController,
      syncAutomatically = true,
    } = options

    if (!identity) {
      throw new Error('Identity is required')
    }

    const path = join(directory || DATABASE_PATH, `./${address}/`)

    const entryStorage
      = options.entryStorage
      || ComposedStorage.create({
        storage1: LRUStorage.create({ size: DATABASE_CACHE_SIZE }),
        storage2: IPFSBlockStorage.create({ ipfs, pin: true }),
      })

    const headsStorage
      = options.headsStorage
      || ComposedStorage.create({
        storage1: LRUStorage.create({ size: DATABASE_CACHE_SIZE }),
        storage2: await LevelStorage.create({
          path: join(path, HEADS_PATH),
        }),
      })

    const indexStorage
      = options.indexStorage
      || ComposedStorage.create({
        storage1: LRUStorage.create({ size: DATABASE_CACHE_SIZE }),
        storage2: await LevelStorage.create({
          path: join(path, INDEX_PATH),
        }),
      })

    const log = new Log<DatabaseOperation<T>>(identity, {
      logId: address,
      accessController,
      entryStorage,
      headsStorage,
      indexStorage,
    })

    const events = new TypedEventEmitter<DatabaseEvents<T>>()
    const queue = new PQueue({ concurrency: 1 })
    const writeQueue = new PQueue({ concurrency: 1 })

    const sync = new Sync({
      ipfs,
      log,
      events,
      start: syncAutomatically,
      onSynced: async (bytes: Uint8Array) => {
        const task = async () => {
          const entry = await Entry.decode<DatabaseOperation<T>>(bytes)
          if (entry) {
            const updated = await log.joinEntry(entry)

            if (updated) {
              if (onUpdate) {
                await onUpdate(log, entry)
              }
              events.dispatchEvent(
                new CustomEvent('update', { detail: { entry } }),
              )
            }
          }
        }

        await queue.add(task)
        await queue.onIdle()
      },
    })

    return new Database(
      log,
      sync,
      events,
      queue,
      writeQueue,
      identity,
      name,
      address,
      meta,
      onUpdate,
    )
  }

  async addOperation(op: DatabaseOperation<any>): Promise<string> {
    return this.writeQueue.add(async () => {
      const batch = [op]

      while (batch.length < this.batchSize && this.writeQueue.size > 0) {
        const nextOp = await this.writeQueue.add(() => Promise.resolve())
        if (nextOp !== undefined) {
          batch.push(nextOp)
        }
      }

      const entries = await Promise.all(
        batch.map(op =>
          this.log.append(op, {
            referencesCount: DATABASE_REFERENCES_COUNT,
          }),
        ),
      )

      await Promise.all(
        entries.map(entry => this.sync.add(entry)),
      )
      if (this.onUpdate) {
        await Promise.all(
          entries.map(entry => this.onUpdate!(this.log, entry)),
        )
      }

      for (const entry of entries) {
        this.events.dispatchEvent(
          new CustomEvent('update', { detail: { entry } }),
        )
      }

      return entries[0].hash!
    }) as Promise<string>
  }

  public async drop(): Promise<void> {
    await this.queue.onIdle()
    await this.log.clear()
    if (this.accessController && this.accessController.drop) {
      await this.accessController.drop()
    }
    this.events.dispatchEvent(new CustomEvent('drop'))
  }

  public async close(): Promise<void> {
    await this.sync.stop()
    await this.queue.onIdle()
    await this.log.close()
    if (this.accessController && this.accessController.close) {
      await this.accessController.close()
    }
    this.events.dispatchEvent(new CustomEvent('close'))
  }
}
