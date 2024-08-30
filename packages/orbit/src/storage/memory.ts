import type { StorageInstance } from './types'

export class MemoryStorage<T = unknown> implements StorageInstance<T> {
  private memory: Map<string, T>

  constructor() {
    this.memory = new Map()
  }

  static create<T>(): MemoryStorage<T> {
    return new MemoryStorage<T>()
  }

  async put(hash: string, data: T): Promise<void> {
    this.memory.set(hash, data)
  }

  async del(hash: string): Promise<void> {
    this.memory.delete(hash)
  }

  async get(hash: string): Promise<T | null> {
    return this.memory.get(hash) || null
  }

  async *iterator(): AsyncIterableIterator<[string, T]> {
    for (const [key, value] of this.memory.entries()) {
      yield [key, value]
    }
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    if (other) {
      for await (const [key, value] of other.iterator()) {
        this.memory.set(key, value)
      }
    }
  }

  async clear(): Promise<void> {
    this.memory.clear()
  }

  async close(): Promise<void> {
    // No-op for memory storage
  }
}
