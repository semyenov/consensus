// @ts-expect-error: lru is not typed
import LRU from 'lru'

import { STORAGE_LRU_SIZE } from '../constants'

import type { StorageInstance } from './types'

export interface LRUStorageOptions {
  size?: number
}

export class LRUStorage<T> implements StorageInstance<T> {
  private lru: LRU<T>
  private readonly size: number

  private constructor({ size = STORAGE_LRU_SIZE }: LRUStorageOptions = {}) {
    this.size = size
    this.lru = new LRU<T>(this.size)
  }

  static create<T>(options: LRUStorageOptions = {}): LRUStorage<T> {
    return new LRUStorage<T>(options)
  }

  async put(hash: string, data: T): Promise<void> {
    this.lru.set(hash, data)
  }

  async del(hash: string): Promise<void> {
    this.lru.remove(hash)
  }

  async get(hash: string): Promise<T | null> {
    return this.lru.get(hash) || null
  }

  async *iterator(): AsyncIterableIterator<[string, T]> {
    for (const key of this.lru.keys) {
      const value = this.lru.get(key)
      yield [key, value] as [string, T]
    }
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    if (other) {
      for await (const [key, value] of other.iterator()) {
        this.lru.set(key, value)
      }
    }
  }

  async clear(): Promise<void> {
    this.lru = new LRU(this.size)
  }

  async close(): Promise<void> {
    // No-op for LRU storage
  }
}
