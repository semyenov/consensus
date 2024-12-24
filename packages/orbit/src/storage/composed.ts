import type { StorageInstance } from './types'

export interface ComposedStorageOptions<T> {
  storage1: StorageInstance<T>
  storage2: StorageInstance<T>
}

export class ComposedStorage<T> implements StorageInstance<T> {
  private readonly storage1: StorageInstance<T>
  private readonly storage2: StorageInstance<T>

  private constructor(options: ComposedStorageOptions<T>) {
    this.storage1 = options.storage1
    this.storage2 = options.storage2
  }

  static create<T>(options: ComposedStorageOptions<T>): ComposedStorage<T> {
    return new ComposedStorage<T>(options)
  }

  async put(hash: string, data: T): Promise<void> {
    await this.storage1.put(hash, data)
    await this.storage2.put(hash, data)
  }

  async get(hash: string): Promise<T | null> {
    let value = await this.storage1.get(hash)
    if (!value) {
      value = await this.storage2.get(hash)
      if (value) {
        await this.storage1.put(hash, value)
      }
    }

    return value
  }

  async del(hash: string): Promise<void> {
    await this.storage1.del(hash)
    await this.storage2.del(hash)
  }

  async *iterator(options?: any): AsyncIterableIterator<[string, T]> {
    const keys = new Map<string, boolean>()

    for (const storage of [this.storage1, this.storage2]) {
      for await (const [key, value] of storage.iterator(options)) {
        if (!keys.has(key)) {
          keys.set(key, true)
          yield [key, value] as [string, T]
        }
      }
    }
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    await this.storage1.merge(other)
    await this.storage2.merge(other)
    await other.merge(this.storage1)
    await other.merge(this.storage2)
  }

  async clear(): Promise<void> {
    await this.storage1.clear()
    await this.storage2.clear()
  }

  async close(): Promise<void> {
    await this.storage1.close()
    await this.storage2.close()
  }
}
