import {
  DATABASE_KEYVALUE_INDEXED_TYPE,
  DATABASE_KEYVALUE_INDEXED_VALUE_ENCODING,
} from '../constants'
import { LevelStorage } from '../storage/level'
import { join } from '../utils'

import { KeyValueDatabase, type KeyValueInstance } from './keyvalue'

import type { DatabaseOperation, DatabaseType } from './index'
import type { DatabaseInstance, DatabaseOptions } from '../database'
import type { EntryInstance } from '../oplog/entry'
import type { LogInstance } from '../oplog/log'
import type { StorageInstance } from '../storage/index'
import type { SyncEvents, SyncInstance } from '../sync'
import type { PeerSet } from '@libp2p/peer-collections'

class Index<T> {
  private index: LevelStorage<EntryInstance<DatabaseOperation<T>>>
  private indexedEntries: LevelStorage<boolean>

  private constructor(
    index: LevelStorage<EntryInstance<DatabaseOperation<T>>>,
    indexedEntries: LevelStorage<boolean>,
  ) {
    this.index = index
    this.indexedEntries = indexedEntries
  }

  static async create<T>(directory?: string): Promise<Index<T>> {
    const index = await LevelStorage.create<
      EntryInstance<DatabaseOperation<T>>
    >({
      path: join(directory || './.orbitdb', `_index`),
      valueEncoding: DATABASE_KEYVALUE_INDEXED_VALUE_ENCODING,
    })
    const indexedEntries = await LevelStorage.create<boolean>({
      path: join(directory || './.orbitdb', `_indexedEntries`),
      valueEncoding: DATABASE_KEYVALUE_INDEXED_VALUE_ENCODING,
    })

    return new Index<T>(index, indexedEntries)
  }

  async isNotIndexed(hash: string): Promise<boolean> {
    return !(await this.isIndexed(hash))
  }

  async isIndexed(hash: string): Promise<boolean> {
    const indexedEntry = await this.indexedEntries.get(hash)

    return indexedEntry === true
  }

  async update(
    log: LogInstance<DatabaseOperation<T>>,
    entry: EntryInstance<T> | EntryInstance<DatabaseOperation<T>>,
  ): Promise<void> {
    const keys = new Set()
    const toBeIndexed = new Set()
    const latest = entry.hash

    const shoudStopTraverse = async (
      entry: EntryInstance<DatabaseOperation<T>>,
    ) => {
      for await (const hash of entry.next!) {
        if (await this.isNotIndexed(hash)) {
          toBeIndexed.add(hash)
        }
      }

      return (await this.isIndexed(latest!)) && toBeIndexed.size === 0
    }

    for await (const entry of log.traverse(null, shoudStopTraverse)) {
      const { hash, payload } = entry
      if (await this.isNotIndexed(hash!)) {
        const { op, key } = payload
        if (op === 'PUT' && !keys.has(key)) {
          keys.add(key)
          await this.index.put(key!, entry)
          await this.indexedEntries.put(hash!, true)
        }
        else if (op === 'DEL' && !keys.has(key)) {
          keys.add(key)
          await this.index.del(key!)
          await this.indexedEntries.put(hash!, true)
        }
        toBeIndexed.delete(hash)
      }
    }
  }

  async close(): Promise<void> {
    await this.index.close()
    await this.indexedEntries.close()
  }

  async drop(): Promise<void> {
    await this.index.clear()
    await this.indexedEntries.clear()
  }

  get(key: string): Promise<EntryInstance<DatabaseOperation<T>> | null> {
    return this.index.get(key)
  }

  iterator(
    options: any,
  ): AsyncIterable<[string, EntryInstance<DatabaseOperation<T>>]> {
    return this.index.iterator({ ...options, limit: options.amount || -1 })
  }
}

export interface KeyValueIndexedOptions<T> {
  storage?: StorageInstance<T>
}

export interface KeyValueIndexedInstance<T = unknown>
  extends DatabaseInstance<T> {
  type: 'keyvalue-indexed'
}

export class KeyValueIndexedDatabase<T = unknown>
implements KeyValueIndexedInstance<T> {
  private keyValueStore: KeyValueInstance<T>
  private index: Index<T>

  get type(): 'keyvalue-indexed' {
    return DATABASE_KEYVALUE_INDEXED_TYPE
  }

  static get type(): 'keyvalue-indexed' {
    return DATABASE_KEYVALUE_INDEXED_TYPE
  }

  private constructor(keyValueStore: KeyValueInstance<T>, index: Index<T>) {
    this.keyValueStore = keyValueStore
    this.index = index
  }

  static async create<T>(
    options: DatabaseOptions<T> & KeyValueIndexedOptions<T>,
  ): Promise<KeyValueIndexedDatabase<T>> {
    const {
      ipfs,
      identity,
      address,
      name,
      accessController,
      directory,
      meta,
      headsStorage,
      entryStorage,
      indexStorage,
      referencesCount,
      syncAutomatically,
    } = options

    const indexDirectory = join(
      directory || './.orbitdb',
      `./${address}/_index/`,
    )

    const index = await Index.create<T>(indexDirectory)
    const keyValueStore = await KeyValueDatabase.create<T>({
      ipfs,
      identity,
      address,
      name,
      accessController,
      directory,
      meta,
      headsStorage,
      entryStorage,
      indexStorage,
      referencesCount,
      syncAutomatically,
      onUpdate: index.update.bind(index),
    })

    return new KeyValueIndexedDatabase<T>(keyValueStore as KeyValueInstance<T>, index)
  }

  get name(): string | undefined {
    return this.keyValueStore.name
  }

  get address(): string | undefined {
    return this.keyValueStore.address
  }

  get meta(): any {
    return this.keyValueStore.meta
  }

  get events(): DatabaseInstance<T>['events'] {
    return this.keyValueStore.events
  }

  get identity(): DatabaseInstance<T>['identity'] {
    return this.keyValueStore.identity
  }

  get accessController(): DatabaseInstance<T>['accessController'] {
    return this.keyValueStore.accessController
  }

  get peers(): PeerSet {
    return this.keyValueStore.peers
  }

  get log(): LogInstance<DatabaseOperation<T>> {
    return this.keyValueStore.log
  }

  get sync(): SyncInstance<
    DatabaseOperation<T>,
    SyncEvents<DatabaseOperation<T>>
  > {
    return this.keyValueStore.sync
  }

  async addOperation<D = T>(operation: DatabaseOperation<D>): Promise<string> {
    return this.keyValueStore.addOperation<D>(operation)
  }

  async get(key: string): Promise<T | null> {
    const entry = await this.index.get(key)
    if (entry) {
      return entry.payload.value
    }

    return null
  }

  async *iterator({ amount = -1 }: { amount?: number } = {}): AsyncIterable<{
    hash: string
    key: string
    value: T | null
  }> {
    const it = this.index.iterator({ amount, reverse: true })
    for await (const record of it) {
      const [_, entry] = record
      const { key, value } = entry.payload
      const hash = entry.hash!
      yield {
        hash,
        key: key!,
        value: value || null,
      }
    }
  }

  async close(): Promise<void> {
    await this.keyValueStore.close()
    await this.index.close()
  }

  async drop(): Promise<void> {
    await this.keyValueStore.drop()
    await this.index.drop()
  }

  // Delegate other methods to keyValueStore
  put(key: string, value: T): Promise<string> {
    return this.keyValueStore.put(key, value)
  }

  del(key: string): Promise<string> {
    return this.keyValueStore.del(key)
  }

  // Add any other methods from KeyValueInstance that need to be implemented
}

export const KeyValueIndexed: DatabaseType<any, 'keyvalue-indexed'> = {
  create: KeyValueIndexedDatabase.create,
  type: DATABASE_KEYVALUE_INDEXED_TYPE,
}
