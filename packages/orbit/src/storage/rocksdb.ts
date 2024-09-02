import { Buffer } from 'node:buffer'

import RocksDB from 'rocksdb'

import { STORAGE_LEVEL_PATH } from '../constants'
import { join } from '../utils'

import type { StorageInstance } from './types'

export interface RocksDBStorageOptions {
  path?: string
}

export class RocksDBStorage<T extends RocksDB.Bytes> implements StorageInstance<T> {
  private db: RocksDB
  private path: string

  private constructor(path: string) {
    this.path = path
    this.db = new RocksDB(this.path)
  }

  static async create<T extends RocksDB.Bytes = RocksDB.Bytes>(
    options: RocksDBStorageOptions = {},
  ): Promise<RocksDBStorage<T>> {
    const path = options.path || join(STORAGE_LEVEL_PATH, 'rocksdb')
    const storage = new RocksDBStorage<T>(path)

    await new Promise<void>((resolve, reject) => {
      storage.db.open({ createIfMissing: true }, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })

    return storage
  }

  async put(hash: string, data: T): Promise<void> {
    await new Promise<void>((resolve) => {
      this.db.put(hash, data, { sync: true }, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err)
          resolve()
        }
        else {
          resolve()
        }
      })
    })
  }

  async del(hash: string): Promise<void> {
    await new Promise<void>((resolve) => {
      this.db.del(hash, { sync: true }, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err)
          resolve()
        }
        else {
          resolve()
        }
      })
    })
  }

  async get(hash: string): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      this.db.get(hash, { asBuffer: false }, (err, value) => {
        if (err) {
          // reject(err)
          resolve(null)
        }
        else {
          resolve(value as T)
        }
      })
    })
  }

  async *iterator(options: RocksDB.IteratorOptions = {}): AsyncIterableIterator<[string, T]> {
    const iterator = this.db.iterator({ keyAsBuffer: false, valueAsBuffer: false, ...options })

    while (true) {
      const result = await new Promise<[string, T] | null>((resolve) => {
        iterator.next((err, key, value) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error(err)
            resolve(null)
          }
          else if (key === undefined && value === undefined) {
            resolve(null)
          }
          else {
            resolve([key.toString('utf8'), value as T])
          }
        })
      })

      if (result === null) {
        break
      }

      yield result
    }

    await new Promise<void>((resolve, reject) => {
      iterator.end((err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    const batch = this.db.batch()
    for await (const [key, value] of other.iterator()) {
      batch.put(key, value)
    }

    await new Promise<void>((resolve, reject) => {
      batch.write((err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  async clear(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.clear((err: Error | null) => {
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.db.close((err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err)
          resolve()
        }
        else {
          resolve()
        }
      })
    })
  }
}
