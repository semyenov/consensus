import { type Client, createClient } from 'edgedb'
import { v4 as uuidv4 } from 'uuid'

import { DATABASE_EDGEDB_TYPE } from '../constants.js'
import {
  Database,
  type DatabaseInstance,
  type DatabaseOptions,
} from '../database.js'

import type { DatabaseOperation, DatabaseType } from '.'
import type { LogInstance } from '../oplog/log.js'
import type { SyncEvents, SyncInstance } from '../sync.js'
import type { PeerSet } from '@libp2p/peer-collections'

export interface EdgeDBOptions<T> extends DatabaseOptions<T> {
  dsn?: string // EdgeDB connection string
}

export interface EdgeDBInstance<T = unknown> extends DatabaseInstance<T> {
  type: 'edgedb'
  client: Client

  query: <R = T>(query: string, args?: any) => Promise<R>
  querySingle: <R = T>(query: string, args?: any) => Promise<R | null>
  execute: (query: string, args?: any) => Promise<void>
}

export class EdgeDBDatabase<T = unknown> implements EdgeDBInstance<T> {
  private database: DatabaseInstance<T>
  public client: Client

  get type(): 'edgedb' {
    return DATABASE_EDGEDB_TYPE
  }

  static get type(): 'edgedb' {
    return DATABASE_EDGEDB_TYPE
  }

  private constructor(database: DatabaseInstance<T>, client: Client) {
    this.database = database
    this.client = client
  }

  static async create<T>(
    options: EdgeDBOptions<T>,
  ): Promise<EdgeDBDatabase<T>> {
    const database = await Database.create<T>(options)
    const client = createClient({ dsn: options.dsn })

    return new EdgeDBDatabase<T>(database, client)
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

  get identity(): DatabaseInstance<T>['identity'] {
    return this.database.identity
  }

  get accessController(): DatabaseInstance<T>['accessController'] {
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

  async addOperation(operation: DatabaseOperation<T>): Promise<string> {
    return this.database.addOperation(operation)
  }

  async query<R = T>(query: string, args?: any): Promise<R> {
    return this.client.query(query, args) as Promise<R>
  }

  async querySingle<R = T>(query: string, args?: any): Promise<R | null> {
    return this.client.querySingle(query, args)
  }

  async execute(query: string, args?: any): Promise<void> {
    await this.client.execute(query, args)
  }

  close(): Promise<void> {
    return this.database.close()
  }

  drop(): Promise<void> {
    return this.database.drop()
  }

  async set(key: string, value: T): Promise<void> {
    const query = `
      INSERT Data {
        key := <str>$key,
        value := <json>$value
      }
      ON CONFLICT (key) DO
      UPDATE SET { value := <json>$value };
    `
    await this.execute(query, { key, value: JSON.stringify(value) })
  }

  async get(key: string): Promise<T | null> {
    const query = `
      SELECT Data.value
      FILTER Data.key = <str>$key
    `
    const result = await this.querySingle<{ value: string }>(query, { key })

    return result ? JSON.parse(result.value) : null
  }

  async del(key: string): Promise<void> {
    const query = `
      DELETE Data
      FILTER Data.key = <str>$key
    `
    await this.execute(query, { key })
  }

  async getMany(keys: string[]): Promise<(T | null)[]> {
    const query = `
      SELECT Data {
        key,
        value
      }
      FILTER Data.key IN array_unpack(<array<str>>$keys)
    `
    const results = await this.query<{ key: string, value: string }[]>(query, { keys })
    const resultMap = new Map(results.map(r => [r.key, JSON.parse(r.value)]))

    return keys.map(key => resultMap.get(key) ?? null)
  }

  async setMany(entries: [string, T][]): Promise<void> {
    const query = `
      FOR entry IN array_unpack(<array<tuple<str, json>>>$entries)
      UNION (
        INSERT Data {
          key := entry.0,
          value := <json>entry.1
        }
        ON CONFLICT (key) DO
        UPDATE SET { value := <json>entry.1 }
      )
    `
    await this.execute(query, { entries: entries.map(([key, value]) => [key, JSON.stringify(value)]) })
  }

  async delMany(keys: string[]): Promise<void> {
    const query = `
      DELETE Data
      FILTER Data.key IN array_unpack(<array<str>>$keys)
    `
    await this.execute(query, { keys })
  }
}

export const EdgeDB: DatabaseType<any, 'edgedb'> = {
  create: EdgeDBDatabase.create,
  type: DATABASE_EDGEDB_TYPE,
}
