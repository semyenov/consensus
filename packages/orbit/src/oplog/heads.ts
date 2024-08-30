import { MemoryStorage, type StorageInstance } from '../storage'

import { Entry, type EntryInstance } from './entry'

export interface HeadsOptions<T> {
  storage?: StorageInstance<Uint8Array>
  heads?: EntryInstance<T>[]
}

export class Heads<T> {
  private storage: StorageInstance<Uint8Array>

  constructor({ storage, heads }: HeadsOptions<T> = {}) {
    this.storage = storage || new MemoryStorage<Uint8Array>()
    if (heads) {
      this.put(heads)
        .catch(console.error)
    }
  }

  async put(heads: EntryInstance<T>[]): Promise<void> {
    const heads_ = Heads.findHeads(heads)
    for (const head of heads_) {
      await this.storage.put(head.hash!, head.bytes!)
    }
  }

  async set(heads: EntryInstance<T>[]): Promise<void> {
    await this.storage.clear()
    await this.put(heads)
  }

  async add(head: EntryInstance<T>): Promise<EntryInstance<T>[] | undefined> {
    const currentHeads = await this.all()
    if (currentHeads.some(e => Entry.isEqual(e, head))) {
      return
    }
    const newHeads = Heads.findHeads([...currentHeads, head])
    await this.set(newHeads)

    return newHeads
  }

  async remove(hash: string): Promise<void> {
    const currentHeads = await this.all()
    const newHeads = currentHeads.filter(e => e.hash !== hash)
    await this.set(newHeads)
  }

  async *iterator(): AsyncGenerator<EntryInstance<T>> {
    const it = this.storage.iterator()
    for await (const [, bytes] of it) {
      const head = await Entry.decode<T>(bytes)
      yield head
    }
  }

  async all(): Promise<EntryInstance<T>[]> {
    const values: EntryInstance<T>[] = []
    for await (const head of this.iterator()) {
      values.push(head)
    }

    return values
  }

  async clear(): Promise<void> {
    await this.storage.clear()
  }

  async close(): Promise<void> {
    await this.storage.close()
  }

  static findHeads<T>(entries: EntryInstance<T>[]): EntryInstance<T>[] {
    const entries_ = new Set(entries)
    const items: Record<string, string> = {}
    for (const entry of entries_) {
      for (const next of entry.next!) {
        items[next!] = entry.hash!
      }
    }

    const res: EntryInstance<T>[] = []
    for (const entry of entries) {
      if (!items[entry.hash!]) {
        res.push(entry)
      }
    }

    return res
  }
}

export async function createHeads<T>(options: HeadsOptions<T> = {}): Promise<Heads<T>> {
  return new Heads<T>(options)
}
