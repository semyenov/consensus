import { type Client, createClient } from 'edgedb'

import type { StorageInstance } from './types'

interface Data {
  key: string
  value: string
}

export interface EdgeDBStorageOptions {
  dsn: string
}
export class EdgeDBStorage<T = unknown> implements StorageInstance<T> {
  private client: Client

  private constructor(client: Client) {
    this.client = client
  }

  static async create<T = unknown>(
    options: EdgeDBStorageOptions,
  ): Promise<EdgeDBStorage<T>> {
    const client = createClient({ dsn: options.dsn })

    return new EdgeDBStorage<T>(client)
  }

  async put(hash: string, data: T): Promise<void> {
    await this.client.query(`
      INSERT Data {
        key := <str>$key,
        value := <str>$value
      };
    `, {
      key: hash,
      value: JSON.stringify(data),
    })
  }

  async get(hash: string): Promise<T | null> {
    const result = await this.client.query<Data>(`
      SELECT Data {
        key,
        value
      } FILTER .key = <str>$key;
    `, {
      key: hash,
    })

    return result.length > 0 ? (JSON.parse(result[0].value) as T) : null
  }

  async del(hash: string): Promise<void> {
    await this.client.query(`
      DELETE Data
        FILTER .key = <str>$key;
    `, {
      key: hash,
    })
  }

  async merge(other: StorageInstance<T>): Promise<void> {
    const iterator = other.iterator()

    for await (const [hash, data] of iterator) {
      await this.put(hash, data)
    }
  }

  async close(): Promise<void> {
    await this.client.close()
  }

  async clear(): Promise<void> {
    await this.client.query(`
      DELETE Data;
    `)
  }

  async *iterator(options?: {
    amount: number
    reverse: boolean
  }): AsyncIterableIterator<[string, T]> {
    const result = await this.client.query<Data>(`
      SELECT Data {
        key,
        value
      }
      ORDER BY .key
      LIMIT $amount
    `, {
      amount: options?.amount ?? 100,
    })

    for (const item of result) {
      yield [item.key, JSON.parse(item.value) as T]
    }
  }
}
