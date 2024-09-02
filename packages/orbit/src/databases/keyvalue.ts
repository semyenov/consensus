import { DATABASE_KEYVALUE_TYPE } from '../constants'
import {
  Database,
  type DatabaseInstance,
  type DatabaseOptions,
} from '../database'

import type { DatabaseOperation, DatabaseType } from '.'
import type { AccessControllerInstance } from '../access-controllers'
import type { IdentityInstance } from '../identities'
import type { EntryInstance } from '../oplog'
import type { LogInstance } from '../oplog/log'
import type { StorageInstance } from '../storage'
import type { SyncEvents, SyncInstance } from '../sync'
import type { HeliaInstance } from '../vendor'
import type { PeerSet } from '@libp2p/peer-collections'

export interface KeyValueDatabaseOptions<T = unknown>
  extends DatabaseOptions<T> {
  ipfs: HeliaInstance
  identity?: IdentityInstance
  address?: string
  name?: string
  access?: AccessControllerInstance
  directory?: string
  meta: any
  headsStorage?: StorageInstance<Uint8Array>
  entryStorage?: StorageInstance<Uint8Array>
  indexStorage?: StorageInstance<boolean>
  referencesCount?: number
  syncAutomatically?: boolean
  onUpdate?: (
    log: LogInstance<DatabaseOperation<T>>,
    entry: EntryInstance<T> | EntryInstance<DatabaseOperation<T>>,
  ) => Promise<void>
}

export interface KeyValueEntry<T> {
  key?: string
  hash?: string
  value: T | null
}

export interface KeyValueInstance<T> extends DatabaseInstance<T> {
  type: 'keyvalue'
  indexBy?: string

  put: (key: string, value: T) => Promise<string>
  set: (key: string, value: T) => Promise<string>
  del: (key: string) => Promise<string>
  get: (key: string) => Promise<T | null>
  iterator: (options?: { amount?: number }) => AsyncIterable<KeyValueEntry<T>>
  all: () => Promise<KeyValueEntry<T>[]>
}

export class KeyValueDatabase<T = unknown> implements KeyValueInstance<T> {
  private database: DatabaseInstance<T>

  get type(): 'keyvalue' {
    return DATABASE_KEYVALUE_TYPE
  }

  static get type(): 'keyvalue' {
    return DATABASE_KEYVALUE_TYPE
  }

  private constructor(database: DatabaseInstance<T>) {
    this.database = database
  }

  static async create<T>(
    options: KeyValueDatabaseOptions<T>,
  ): Promise<KeyValueDatabase<T>> {
    const database = await Database.create<T>(options)

    return new KeyValueDatabase<T>(database as DatabaseInstance<T>)
  }

  get indexBy(): string | undefined {
    return this.database.indexBy
  }

  get name(): string | undefined {
    return this.database.name
  }

  get address(): string | undefined {
    return this.database.address
  }

  get meta(): any {
    return this.database.meta
  }

  get events(): DatabaseInstance<T>['events'] {
    return this.database.events
  }

  get identity(): IdentityInstance {
    return this.database.identity
  }

  get accessController(): AccessControllerInstance {
    return this.database.accessController
  }

  get peers(): PeerSet {
    return this.database.peers
  }

  get log(): LogInstance<DatabaseOperation<T>> {
    return this.database.log
  }

  get sync(): SyncInstance<
    DatabaseOperation<T>,
    SyncEvents<DatabaseOperation<T>>
  > {
    return this.database.sync
  }

  async addOperation<D = T>(operation: DatabaseOperation<D>): Promise<string> {
    return this.database.addOperation<D>(operation)
  }

  async put(key: string, value: T): Promise<string> {
    return this.database.addOperation({ op: 'PUT', key, value })
  }

  async set(key: string, value: T): Promise<string> {
    return this.put(key, value)
  }

  async del(key: string): Promise<string> {
    return this.database.addOperation({ op: 'DEL', key, value: null })
  }

  async get(key: string): Promise<T | null> {
    for await (const entry of this.database.log.traverse()) {
      const { op, key: k, value } = entry.payload
      if (op === 'PUT' && k === key) {
        return value as T
      }
      else if (op === 'DEL' && k === key) {
        return null
      }
    }

    return null
  }

  async *iterator({ amount }: { amount?: number } = {}): AsyncIterable<
    KeyValueEntry<T>
  > {
    const keys: Record<string, boolean> = {}
    let count = 0
    for await (const entry of this.database.log.traverse()) {
      const { op, key, value } = entry.payload
      if (op === 'PUT' && !keys[key!]) {
        keys[key!] = true
        count++
        const hash = entry.hash!
        yield { key: key!, value: value || null, hash }
      }
      else if (op === 'DEL' && !keys[key!]) {
        keys[key!] = true
      }
      if (amount !== undefined && count >= amount) {
        break
      }
    }
  }

  async all(): Promise<KeyValueEntry<T>[]> {
    const values: KeyValueEntry<T>[] = []
    for await (const entry of this.iterator()) {
      values.unshift(entry)
    }

    return values
  }

  close(): Promise<void> {
    return this.database.close()
  }

  drop(): Promise<void> {
    return this.database.drop()
  }
}

export const KeyValue: DatabaseType<any, 'keyvalue'> = {
  create: KeyValueDatabase.create,
  type: DATABASE_KEYVALUE_TYPE,
}
