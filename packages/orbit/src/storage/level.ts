import { Level, type IteratorOptions as LevelIteratorOptions } from 'level'

import { STORAGE_LEVEL_PATH, STORAGE_LEVEL_VALUE_ENCODING } from '../constants'

import type { StorageInstance } from './types'

export interface LevelStorageOptions {
  path?: string
  valueEncoding?: string
}

export class LevelStorage<T = unknown> implements StorageInstance<T> {
  private level: Level<string, T>

  private constructor(
    private path: string = STORAGE_LEVEL_PATH,
    private valueEncoding: string = STORAGE_LEVEL_VALUE_ENCODING,
  ) {
    this.level = new Level<string, T>(this.path, {
      valueEncoding: this.valueEncoding,
      createIfMissing: true,
    })
  }

  static async create<T = unknown>(
    options: LevelStorageOptions = {},
  ): Promise<LevelStorage<T>> {
    const storage = new LevelStorage<T>(options.path, options.valueEncoding)
    await storage.level.open() // async

    return storage
  }

  async put(hash: string, value: T): Promise<void> {
    await this.level.put(hash, value)
  }

  async del(hash: string): Promise<void> {
    await this.level.del(hash)
  }

  async get(hash: string): Promise<T | null> {
    try {
      const value = await this.level.get(hash)

      return value || null
    }
    catch {
      return null
    }
  }

  async *iterator(
    options: LevelIteratorOptions<string, T> = {},
  ): AsyncIterableIterator<[string, T]> {
    for await (const [key, value] of this.level.iterator(options)) {
      yield [key, value] as [string, T]
    }
  }

  async merge(): Promise<void> {
    // No-op for LevelStorage
  }

  async clear(): Promise<void> {
    await this.level.clear()
  }

  async close(): Promise<void> {
    await this.level.close()
  }
}
