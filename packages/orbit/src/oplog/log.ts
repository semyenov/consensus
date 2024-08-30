/* eslint-disable unused-imports/no-unused-vars */
// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore
import LRU from 'lru'
import PQueue from 'p-queue'

import { MemoryStorage } from '../storage/memory.js'

import { Clock, type ClockInstance } from './clock.js'
import { ConflictResolution } from './conflict-resolution.js'
import { Entry, type EntryInstance } from './entry.js'
import { Heads } from './heads.js'

import type { AccessControllerInstance } from '../access-controllers/index.js'
import type { IdentityInstance } from '../identities/index.js'
import type { StorageInstance } from '../storage'

export interface LogIteratorOptions {
  gt?: string
  gte?: string
  lt?: string
  lte?: string
  amount?: number
}

export interface LogAppendOptions {
  referencesCount: number
}

export interface LogOptions<T> {
  logId?: string
  logHeads?: EntryInstance<T>[]
  entries?: EntryInstance<T>[]
  entryStorage?: StorageInstance<Uint8Array>
  headsStorage?: StorageInstance<Uint8Array>
  indexStorage?: StorageInstance<boolean>
  accessController?: AccessControllerInstance
  sortFn?: (a: EntryInstance<T>, b: EntryInstance<T>) => number
}

export interface LogInstance<T> {
  id: string
  access?: AccessControllerInstance
  identity: IdentityInstance
  storage: StorageInstance<Uint8Array>
  clock: () => Promise<ClockInstance>
  heads: () => Promise<EntryInstance<T>[]>
  values: () => Promise<EntryInstance<T>[]>
  all: () => Promise<EntryInstance<T>[]>
  get: (hash: string) => Promise<EntryInstance<T> | null>
  has: (hash: string) => Promise<boolean>
  append: (payload: T, options?: LogAppendOptions) => Promise<EntryInstance<T>>
  join: (log: LogInstance<T>) => Promise<void>
  joinEntry: (entry: EntryInstance<T>, dbname?: string) => Promise<boolean>
  traverse: (
    rootEntries?: EntryInstance<T>[] | null,
    shouldStopFn?: (
      entry: EntryInstance<T>,
      useRefs?: boolean,
    ) => Promise<boolean>,
    useRefs?: boolean,
  ) => AsyncGenerator<EntryInstance<T>>
  iterator: (options?: LogIteratorOptions) => AsyncIterable<EntryInstance<T>>
  clear: () => Promise<void>
  close: () => Promise<void>
}

export class Log<T> implements LogInstance<T> {
  public id: string
  public access?: AccessControllerInstance
  public identity: IdentityInstance
  public storage: StorageInstance<Uint8Array>

  private indexStorage: StorageInstance<boolean>
  private headsStorage: StorageInstance<Uint8Array>
  private heads_: Heads<T>
  private sortFn: (a: EntryInstance<T>, b: EntryInstance<T>) => number
  private appendQueue: PQueue
  private joinQueue: PQueue

  constructor(identity: IdentityInstance, options: LogOptions<T> = {}) {
    if (!identity) {
      throw new Error('Identity is required')
    }
    if (options.logHeads && !Array.isArray(options.logHeads)) {
      throw new Error('\'logHeads\' argument must be an array')
    }

    this.id = options.logId || Log.randomId()
    this.identity = identity
    this.access = options.accessController || Log.defaultAccessController()
    this.storage = options.entryStorage || new MemoryStorage()
    this.indexStorage = options.indexStorage || new MemoryStorage()
    this.headsStorage = options.headsStorage || new MemoryStorage()
    this.heads_ = new Heads<T>({
      storage: this.headsStorage,
      heads: options.logHeads,
    })
    this.sortFn = ConflictResolution.NoZeroes(
      options.sortFn || ConflictResolution.LastWriteWins,
    )
    this.appendQueue = new PQueue({ concurrency: 1 })
    this.joinQueue = new PQueue({ concurrency: 1 })
  }

  public static randomId(): string {
    return Date.now()
      .toString()
  }

  public static isLog(obj: any): obj is LogInstance<any> {
    return (
      obj
      && obj.id !== undefined
      && obj.clock !== undefined
      && obj.heads !== undefined
      && obj.values !== undefined
      && obj.access !== undefined
      && obj.identity !== undefined
      && obj.storage !== undefined
    )
  }

  public static defaultAccessController(): AccessControllerInstance {
    return {
      write: [],
      type: 'allow-all',
      canAppend: async (entry: EntryInstance<any>) => {
        return true
      },
    }
  }

  public static maxClockTimeReducer(res: number, acc: EntryInstance): number {
    return Math.max(res, acc.clock.time)
  }

  async clock(): Promise<ClockInstance> {
    const heads = await this.heads()
    const maxTime = Math.max(0, heads.reduce(Log.maxClockTimeReducer, 0))

    return Clock.create(this.identity.publicKey, maxTime)
  }

  async heads(): Promise<EntryInstance<T>[]> {
    const res = await this.heads_.all()

    return res.sort(this.sortFn)
      .reverse()
  }

  async values(): Promise<EntryInstance<T>[]> {
    const values = []
    for await (const entry of this.traverse()) {
      values.unshift(entry)
    }

    return values
  }

  all(): Promise<EntryInstance<T>[]> {
    return this.values()
  }

  async get(hash: string): Promise<EntryInstance<T> | null> {
    const bytes = await this.storage.get(hash)
    if (bytes) {
      return Entry.decode<T>(bytes)
    }

    return null
  }

  async has(hash: string): Promise<boolean> {
    const entry = await this.indexStorage.get(hash)

    return Boolean(entry)
  }

  async append(
    data: T,
    options: LogAppendOptions = { referencesCount: 0 },
  ): Promise<EntryInstance<T>> {
    return this.appendQueue.add(async () => {
      const headsEntries = await this.heads()
      const next_ = headsEntries.map((entry) => {
        return entry
      })
      const refs_ = await this.getReferences(
        headsEntries,
        options.referencesCount + headsEntries.length,
      )
      const entry = await Entry.create<T>(
        this.identity,
        this.id,
        data,
        (await this.clock()).tick(),
        next_.map((n) => {
          return n.hash!
        }),
        refs_,
      )

      const canAppend = await this.access!.canAppend(entry)
      if (!canAppend) {
        throw new Error(
          `Could not append entry: Key "${this.identity.hash}" is not allowed to write to the log`,
        )
      }
      await this.heads_.set([entry])
      await this.storage.put(entry.hash!, entry.bytes!)
      await this.indexStorage.put(entry.hash!, true)

      return entry
    }) as Promise<EntryInstance<T>>
  }

  async join(log: LogInstance<T>): Promise<void> {
    if (!log) {
      throw new Error('Log instance not defined')
    }
    if (!Log.isLog(log)) {
      throw new Error('Given argument is not an instance of Log')
    }
    if (this.storage.merge) {
      await this.storage.merge(log.storage)
    }
    const heads = await log.heads()
    for (const entry of heads) {
      await this.joinEntry(entry)
    }
  }

  async joinEntry(entry: EntryInstance<T>): Promise<boolean> {
    return this.joinQueue.add(async () => {
      const isAlreadyInTheLog = await this.has(entry.hash!)
      if (isAlreadyInTheLog) {
        return false
      }
      await this.verifyEntry(entry)

      const headsHashes = (await this.heads())
        .map((e) => {
          return e.hash
        })
        .filter((e) => {
          return e !== undefined
        })
      const hashesToAdd = new Set([entry.hash!])
      const hashesToGet = new Set([
        ...(entry.next ?? []),
        ...(entry.refs ?? []),
      ])
      const connectedHeads = new Set<string>()

      await this.traverseAndVerify(
        hashesToAdd,
        hashesToGet,
        headsHashes,
        connectedHeads,
      )

      for (const hash of hashesToAdd.values()) {
        await this.indexStorage.put(hash!, true)
      }

      for (const hash of connectedHeads.values()) {
        await this.heads_.remove(hash)
      }

      await this.heads_.add(entry)

      return true
    }) as Promise<boolean>
  }

  async *traverse(
    rootEntries?: EntryInstance<T>[] | null,
    shouldStopFn: (
      entry: EntryInstance<T>,
      useRefs: boolean,
    ) => Promise<boolean> = this.defaultStopFn,
    useRefs = true,
  ): AsyncGenerator<EntryInstance<T>> {
    let toFetch: string[] = []
    const rootEntries_ = rootEntries || (await this.heads())
    let stack = rootEntries_.sort(this.sortFn)
    const fetched: Record<string, boolean> = {}
    const traversed: Record<string, boolean> = {}
    const notIndexed = (hash: string) => {
      return !(traversed[hash!] || fetched[hash!])
    }

    while (stack.length > 0) {
      stack = stack.sort(this.sortFn)
      const entry = stack.pop() as EntryInstance<T>
      if (entry && !traversed[entry.hash!]) {
        yield entry
        const done = await shouldStopFn(entry, useRefs)
        if (done) {
          break
        }
        traversed[entry.hash!] = true
        fetched[entry.hash!] = true
        toFetch = [
          ...toFetch,
          ...entry.next,
          ...(useRefs ? entry.refs : []),
        ].filter(notIndexed)
        const nexts = (
          await Promise.all(toFetch.map(async (hash) => {
            if (!traversed[hash] && !fetched[hash]) {
              fetched[hash] = true

              return await this.get(hash)
            }
          }))
        ).filter((e): e is EntryInstance<T> => {
          return e !== null && e !== undefined
        })
        toFetch = nexts
          .reduce(
            (acc, cur) => {
              return Array.from(
                new Set([...acc, ...cur.next!, ...(useRefs ? cur.refs! : []).values()]),
              )
            },
            [] as string[],
          )
          .filter(notIndexed)
        stack = [...nexts, ...stack]
      }
    }
  }

  async *iterator(
    options: LogIteratorOptions = { amount: -1 },
  ): AsyncIterable<EntryInstance<T>> {
    const { amount = -1, lte, lt, gt, gte } = options
    if (amount === 0) {
      return
    }

    const start = await this.getStartEntries(lt, lte)
    const end = gt || gte ? await this.get((gt || gte)!) : null
    const amountToIterate = end || amount === -1 ? -1 : amount

    let count = 0
    const shouldStopTraversal = async (entry: EntryInstance<T>) => {
      count++
      if (!entry) {
        return false
      }
      if (count >= amountToIterate! && amountToIterate !== -1) {
        return true
      }
      if (end && Entry.isEqual(entry, end)) {
        return true
      }

      return false
    }

    let index = 0
    const useBuffer = (end || false) && amount !== -1 && !lt && !lte
    const buffer = useBuffer ? new LRU(amount + 2) : null

    const it = this.traverse(start, shouldStopTraversal)

    for await (const entry of it) {
      const skipFirst = lt && Entry.isEqual(entry, start[0])
      const skipLast = gt && Entry.isEqual(entry, end!)
      const skip = skipFirst || skipLast
      if (!skip) {
        if (useBuffer) {
          buffer!.set(index++, entry.hash)
        }
        else {
          yield entry
        }
      }
    }

    if (useBuffer) {
      const endIndex = buffer!.keys.length
      const startIndex = endIndex > amount ? endIndex - amount : 0
      const keys = buffer!.keys.slice(startIndex, endIndex)
      for (const key of keys) {
        const hash = buffer!.get(key)
        const entry = await this.get(hash)
        if (entry) {
          yield entry
        }
      }
    }
  }

  async clear(): Promise<void> {
    await this.indexStorage.clear()
    await this.headsStorage.clear()
    await this.storage.clear()
  }

  async close(): Promise<void> {
    await this.indexStorage.close()
    await this.headsStorage.close()
    await this.storage.close()
  }

  private defaultStopFn = async (
    entry: EntryInstance<T>,
    useRefs: boolean,
  ): Promise<boolean> => {
    return false
  }

  private async getStartEntries(
    lt?: string,
    lte?: string,
  ): Promise<EntryInstance<T>[]> {
    if (typeof lte === 'string') {
      const entry = await this.get(lte)

      return entry ? [entry] : []
    }

    if (typeof lt === 'string') {
      const entry = await this.get(lt)
      if (entry) {
        const nexts = await Promise.all(
          (entry.next ?? []).map((n) => {
            return this.get(n)
          }),
        )

        return nexts.filter((e): e is EntryInstance<T> => {
          return e !== null
        })
      }
    }

    return this.heads()
  }

  private async verifyEntry(entry: EntryInstance<T>): Promise<void> {
    if (entry.id !== this.id) {
      throw new Error(
        `Entry's id (${entry.id}) doesn't match the log's id (${this.id}).`,
      )
    }
    const canAppend = await this.access!.canAppend(entry)
    if (!canAppend) {
      throw new Error(
        `Could not append entry: Key "${entry.identity}" is not allowed to write to the log`,
      )
    }

    const isValid = await Entry.verify(this.identity, entry)
    if (!isValid) {
      throw new Error(`Could not validate signature for entry "${entry.hash}"`)
    }
  }

  private async traverseAndVerify(
    hashesToAdd: Set<string>,
    hashesToGet: Set<string>,
    headsHashes: string[],
    connectedHeads: Set<string>,
  ): Promise<void> {
    const getEntries = Array.from(hashesToGet.values())
      .filter((hash) => {
        return this.has(hash)
      })
      .map((hash) => {
        return this.get(hash)
      })
    const entries = await Promise.all(getEntries)

    for (const e of entries) {
      if (!e) {
        continue
      }

      hashesToGet.delete(e.hash!)
      await this.verifyEntry(e)
      hashesToAdd.add(e.hash!)

      for (const hash of [...(e.next ?? []), ...(e.refs ?? [])]) {
        const isInTheLog = await this.has(hash)
        if (!isInTheLog && !hashesToAdd.has(hash)) {
          hashesToGet.add(hash)
        }
        else if (headsHashes.includes(hash)) {
          connectedHeads.add(hash)
        }
      }
    }

    if (hashesToGet.size > 0) {
      await this.traverseAndVerify(
        hashesToAdd,
        hashesToGet,
        headsHashes,
        connectedHeads,
      )
    }
  }

  private async getReferences(
    heads: EntryInstance<T>[],
    amount: number,
  ): Promise<string[]> {
    let refs: string[] = []
    const shouldStopTraversal = async () => {
      return refs.length >= amount && amount !== -1
    }
    for await (const { hash } of this.traverse(
      heads,
      shouldStopTraversal,
      false,
    )) {
      if (!hash) {
        continue
      }

      refs.push(hash)
    }
    refs = refs.slice(heads.length + 1, amount)

    return refs
  }

  private async fetchEntry(hash: string): Promise<EntryInstance<T> | null> {
    return await this.get(hash)
  }
}
