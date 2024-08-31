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
        // eslint-disable-next-line no-console
        .catch(console.error)
    }
  }

  async put<D = T>(heads: EntryInstance<D>[]): Promise<void> {
    const heads_ = Heads.findHeads(heads)
    for (const head of heads_) {
      await this.storage.put(head.hash!, head.bytes!)
    }
  }

  async set<D = T>(heads: EntryInstance<D>[]): Promise<void> {
    await this.storage.clear()
    await this.put(heads)
  }

  async add<D = T>(head: EntryInstance<D>): Promise<EntryInstance<D>[] | undefined> {
    const currentHeads = await this.all<D>()
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

  async *iterator<D = T>(): AsyncGenerator<EntryInstance<D>> {
    const it = this.storage.iterator()
    for await (const [, bytes] of it) {
      const head = await Entry.decode<D>(bytes)
      yield head
    }
  }

  async all<D = T>(): Promise<EntryInstance<D>[]> {
    const values: EntryInstance<D>[] = []
    for await (const head of this.iterator<D>()) {
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
