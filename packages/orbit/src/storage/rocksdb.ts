import { Buffer } from 'node:buffer'

import RocksDB from 'rocksdb'

import { STORAGE_LEVEL_PATH } from '../constants'
import { join } from '../utils'

import type { StorageInstance } from './types'

export interface RocksDBStorageOptions {
  path?: string
}

export class RocksDBStorage<T = RocksDB.Bytes> implements StorageInstance<T> {
  private db: RocksDB
  private path: string

  private constructor(path: string) {
    this.path = path
    this.db = new RocksDB(this.path)
  }

  static async create<T = unknown>(
    options: RocksDBStorageOptions = {},
  ): Promise<RocksDBStorage<T>> {
    const path = options.path || join(STORAGE_LEVEL_PATH, 'rocksdb')
    const storage = new RocksDBStorage<T>(path)
    await new Promise<void>((resolve, reject) => {
      storage.db.open((err) => {
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

  private handleError(err: Error | undefined): void {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  async put(hash: string, data: T): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(data))
    this.db.put(hash, buffer, { sync: true }, (err) => {
      if (err) {
        this.handleError(err)
      }
    })
  }

  async del(hash: string): Promise<void> {
    this.db.del(hash, { sync: true }, (err) => {
      if (err) {
        this.handleError(err)
      }
    })
  }

  async get(hash: string): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
      this.db.get(hash, (err, value) => {
        if (err) {
          this.handleError(err)
          reject(err)
        }
        else {
          resolve(value ? value as T : null)
        }
      })
    })
  }

  async *iterator(options: RocksDB.IteratorOptions = {}): AsyncIterableIterator<[string, T]> {
    const iterator = this.db.iterator(options)

    try {
      while (true) {
        const result = await new Promise<[RocksDB.Bytes, RocksDB.Bytes] | null>((resolve, reject) => {
          iterator.next((err, key, value) => {
            if (err) {
              reject(err)
            }
            else if (key === undefined && value === undefined) {
              resolve(null)
            }
            else {
              resolve(result)
            }
          })
        })

        if (result === null) {
          break
        }

        const [key, value] = result

        yield [key.toString(), JSON.parse(value.toString()) as T]
      }
    }
    catch (error) {
      this.handleError(error as Error)
    }
    finally {
      await new Promise<void>((resolve) => {
        iterator.end((err) => {
          if (err) {
            this.handleError(err)
          }
          else {
            resolve()
          }
        })
      })
    }
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    const batch = this.db.batch()
    for await (const [key, value] of other.iterator()) {
      batch.put(key, JSON.stringify(value))
    }
    await new Promise<void>((resolve, reject) => {
      batch.write((err) => {
        if (err) {
          this.handleError(err)
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
          this.handleError(err)
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          this.handleError(err)
          reject(err)
        }
        else {
          resolve()
        }
      })
    })
  }
}
