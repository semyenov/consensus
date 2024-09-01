import { DATABASE_DOCUMENTS_TYPE } from '../constants'
import {
  Database,
  type DatabaseInstance,
  type DatabaseOptions,
} from '../database'

import type { DatabaseOperation } from '.'
import type { DatabaseType } from './index'
import type { LogInstance } from '../oplog/log'
import type { SyncEvents, SyncInstance } from '../sync'
import type { PeerSet } from '@libp2p/peer-collections'

export interface DocumentsDoc<T = unknown> {
  key?: string
  hash?: string
  value: T | null
}

export interface DocumentsIteratorOptions {
  amount?: number
}

export interface DocumentsOptions {
  indexBy?: string
}

export interface DocumentsInstance<T = unknown> extends DatabaseInstance<T> {
  type: 'documents'
  indexBy: string

  all: () => Promise<DocumentsDoc<T>[]>
  del: (key: string) => Promise<string>
  get: (key: string) => Promise<DocumentsDoc<T> | null>
  iterator: (
    options?: DocumentsIteratorOptions,
  ) => AsyncIterable<DocumentsDoc<T>>
  put: (doc: T) => Promise<string>
  query: (findFn: (doc: T) => boolean) => Promise<T[]>
}

export class DocumentsDatabase<T = unknown> implements DocumentsInstance<T> {
  private database: DatabaseInstance<T>
  public indexBy: string

  get type(): 'documents' {
    return DATABASE_DOCUMENTS_TYPE
  }

  static get type(): 'documents' {
    return DATABASE_DOCUMENTS_TYPE
  }

  private constructor(database: DatabaseInstance<T>, indexBy: string) {
    this.database = database
    this.indexBy = indexBy
  }

  static async create<T>(
    options: DatabaseOptions<unknown> & DocumentsOptions,
  ): Promise<DocumentsDatabase<T>> {
    const indexBy = options.indexBy || '_id'
    const database = await Database.create<unknown>(options)

    return new DocumentsDatabase<T>(database as DatabaseInstance<T>, indexBy)
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

  async addOperation<D = T>(operation: DatabaseOperation<D>): Promise<string> {
    return this.database.addOperation(operation)
  }

  async put<D = T>(doc: D): Promise<string> {
    const key = doc[this.indexBy as keyof D]
    if (!key) {
      throw new Error(
        `The provided document doesn't contain field '${String(this.indexBy)}'`,
      )
    }

    return this.database.addOperation({
      op: 'PUT',
      key: String(key),
      value: doc,
    })
  }

  async del(key: string): Promise<string> {
    if (!(await this.get(key))) {
      throw new Error(`No document with key '${key}' in the database`)
    }

    return this.database.addOperation({ op: 'DEL', key, value: null })
  }

  async get(key: string): Promise<DocumentsDoc<T> | null> {
    for await (const doc of this.iterator()) {
      if (key === doc.key) {
        return doc
      }
    }

    return null
  }

  async query(findFn: (doc: T) => boolean): Promise<T[]> {
    const results: T[] = []
    for await (const doc of this.iterator()) {
      if (doc.value && findFn(doc.value)) {
        results.push(doc.value)
      }
    }

    return results
  }

  async *iterator({ amount }: DocumentsIteratorOptions = {}): AsyncGenerator<
    DocumentsDoc<T>,
    void,
    unknown
  > {
    const keys: Record<string, boolean> = {}
    let count = 0
    // const files = [] // TODO: remove
    for await (const entry of this.database.log.iterator()) {
      const {
        op,
        key,
        value,
      } = entry.payload

      // files.push(entry) // TODO: wtf?

      if (op === 'PUT' && !keys[key!]) {
        keys[key!] = true
        count++
        const hash = entry.hash!

        yield {
          hash,
          key: key!,
          value: value || null,
        }
      }
      else if (op === 'DEL' && !keys[key!]) {
        keys[key!] = true
      }
      if (amount !== undefined && count >= amount) {
        break
      }
    }
  }

  async all(): Promise<DocumentsDoc<T>[]> {
    const values: DocumentsDoc<T>[] = []
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

export const Documents: DatabaseType<any, 'documents'> = {
  create: DocumentsDatabase.create,
  type: DATABASE_DOCUMENTS_TYPE,
}
