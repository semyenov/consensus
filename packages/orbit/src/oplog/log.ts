/* eslint-disable unused-imports/no-unused-vars */
// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore
import LRU from 'lru'
import PQueue from 'p-queue'

import { MemoryStorage } from '../storage/memory'

import { Clock, type ClockInstance } from './clock'
import { ConflictResolution } from './conflict-resolution'
import { Entry, type EntryInstance } from './entry'
import { Heads } from './heads'

import type { AccessControllerInstance } from '../access-controllers/index'
import type { IdentityInstance } from '../identities/index'
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
  identity: IdentityInstance
  storage: StorageInstance<Uint8Array>
  accessController: AccessControllerInstance
  clock: () => Promise<ClockInstance>
  heads: <D = T>() => Promise<EntryInstance<D>[]>
  values: <D = T>() => Promise<EntryInstance<D>[]>
  all: <D = T>() => Promise<EntryInstance<D>[]>
  get: <D = T>(hash: string) => Promise<EntryInstance<D> | null>
  has: (hash: string) => Promise<boolean>
  append: <D = T>(payload: D, options?: LogAppendOptions) => Promise<EntryInstance<D>>
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
  iterator: <D = T>(options?: LogIteratorOptions) => AsyncIterable<EntryInstance<D>>
  clear: () => Promise<void>
  close: () => Promise<void>
}

export class Log<T> implements LogInstance<T> {
  public id: string
  public accessController: AccessControllerInstance
  public identity: IdentityInstance
  public storage: StorageInstance<Uint8Array>

  private indexStorage: StorageInstance<boolean>
  private headsStorage: StorageInstance<Uint8Array>
  private heads_: Heads<T>
  private sortFn: (a: EntryInstance<any>, b: EntryInstance<any>) => number
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
    this.accessController = options.accessController || Log.defaultAccessController()
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

  public static defaultAccessController(): AccessControllerInstance {
    return {
      write: [],
      type: 'allow-all',
      canAppend: async (entry: EntryInstance<any>) => true,
    }
  }

  public static maxClockTimeReducer(res: number, acc: EntryInstance): number {
    return Math.max(res, acc.clock.time)
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

  async clock(): Promise<ClockInstance> {
    const heads = await this.heads()
    const maxTime = Math.max(0, heads.reduce(Log.maxClockTimeReducer, 0))

    return Clock.create(this.identity.publicKey, maxTime)
  }

  async heads<D = T>(): Promise<EntryInstance<D>[]> {
    const res = await this.heads_.all<D>()

    return res.sort(this.sortFn)
      .reverse()
  }

  async values<D = T>(): Promise<EntryInstance<D>[]> {
    const values = []
    for await (const entry of this.traverse<D>()) {
      values.unshift(entry)
    }

    return values
  }

  async all<D = T>(): Promise<EntryInstance<D>[]> {
    return this.values()
  }

  async get<D = T>(hash: string): Promise<EntryInstance<D> | null> {
    const bytes = await this.storage.get(hash)
    if (bytes) {
      return Entry.decode<D>(bytes)
    }

    return null
  }

  async has(hash: string): Promise<boolean> {
    const entry = await this.indexStorage.get(hash)

    return Boolean(entry)
  }

  async append<D = T>(
    data: D,
    options: LogAppendOptions = { referencesCount: 0 },
  ): Promise<EntryInstance<D>> {
    return this.appendQueue.add(async () => {
      const headsEntries = await this.heads()
      const next_ = headsEntries.map(entry => entry)
      const refs_ = await this.getReferences(
        headsEntries,
        options.referencesCount + headsEntries.length,
      )
      const entry = await Entry.create<D>(
        this.identity,
        this.id,
        data,
        (await this.clock()).tick(),
        next_.map(n => n.hash!),
        refs_,
      )

      const canAppend = await this.accessController!.canAppend(entry)
      if (!canAppend) {
        throw new Error(
          `Could not append entry: Key "${this.identity.hash}" is not allowed to write to the log`,
        )
      }
      await this.heads_.set([entry])
      await this.storage.put(entry.hash!, entry.bytes!)
      await this.indexStorage.put(entry.hash!, true)

      return entry
    }) as Promise<EntryInstance<D>>
  }

  async join<D = T>(log: LogInstance<D>): Promise<void> {
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

  async joinEntry<D = T>(entry: EntryInstance<D>): Promise<boolean> {
    return this.joinQueue.add(async () => {
      const isAlreadyInTheLog = await this.has(entry.hash!)
      if (isAlreadyInTheLog) {
        return false
      }
      await this.verifyEntry(entry)

      const headsHashes = (await this.heads())
        .map(e => e.hash)
        .filter(e => e !== undefined)
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

  async *traverse<D = T>(
    rootEntries?: EntryInstance<D>[] | null,
    shouldStopFn: (
      entry: EntryInstance<D>,
      useRefs: boolean,
    ) => Promise<boolean> = this.defaultStopFn,
    useRefs = true,
  ): AsyncGenerator<EntryInstance<D>> {
    let toFetch: string[] = []
    const rootEntries_ = rootEntries || (await this.heads()) as EntryInstance<D>[]
    let stack = rootEntries_.sort(this.sortFn)
    const fetched: Record<string, boolean> = {}
    const traversed: Record<string, boolean> = {}
    const notIndexed = (hash: string) => !(traversed[hash!] || fetched[hash!])

    while (stack.length > 0) {
      stack = stack.sort(this.sortFn)
      const entry = stack.pop() as EntryInstance<D>
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

              return await this.get<D>(hash)
            }
          }))
        ).filter((e): e is EntryInstance<D> => e !== null && e !== undefined)
        toFetch = nexts
          .reduce(
            (acc, cur) => Array.from(
              new Set([...acc, ...cur.next!, ...(useRefs ? cur.refs! : []).values()]),
            ),
            [] as string[],
          )
          .filter(notIndexed)
        stack = [...nexts, ...stack]
      }
    }
  }

  async *iterator<D = T>(
    options: LogIteratorOptions = { amount: -1 },
  ): AsyncIterable<EntryInstance<D>> {
    const { amount = -1, lte, lt, gt, gte } = options
    if (amount === 0) {
      return
    }

    const start = await this.getStartEntries<D>(lt, lte)
    const end = gt || gte ? await this.get<D>((gt || gte)!) : null
    const amountToIterate = end || amount === -1 ? -1 : amount

    let count = 0
    const shouldStopTraversal = async (entry: EntryInstance<D>) => {
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

    const it = this.traverse<D>(start, shouldStopTraversal)

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
        const entry = await this.get<D>(hash)
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

  private defaultStopFn = async <D = T>(
    entry: EntryInstance<D>,
    useRefs: boolean,
  ): Promise<boolean> => false

  private async getStartEntries<D = T>(
    lt?: string,
    lte?: string,
  ): Promise<EntryInstance<D>[]> {
    if (typeof lte === 'string') {
      const entry = await this.get<D>(lte)

      return entry ? [entry] : []
    }

    if (typeof lt === 'string') {
      const entry = await this.get<D>(lt)
      if (entry) {
        const nexts = await Promise.all(
          (entry.next ?? []).map(n => this.get<D>(n)),
        )

        return nexts.filter((e): e is EntryInstance<D> => e !== null)
      }
    }

    return this.heads() as Promise<EntryInstance<D>[]>
  }

  private async verifyEntry<D = T>(entry: EntryInstance<D>): Promise<void> {
    if (entry.id !== this.id) {
      throw new Error(
        `Entry's id (${entry.id}) doesn't match the log's id (${this.id}).`,
      )
    }
    const canAppend = await this.accessController!.canAppend(entry)
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

  private async traverseAndVerify<D = T>(
    hashesToAdd: Set<string>,
    hashesToGet: Set<string>,
    headsHashes: string[],
    connectedHeads: Set<string>,
  ): Promise<void> {
    const getEntries = Array.from(hashesToGet.values())
      .filter(hash => this.has(hash))
      .map(hash => this.get<D>(hash))
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

  private async getReferences<D = T>(
    heads: EntryInstance<D>[],
    amount: number,
  ): Promise<string[]> {
    let refs: string[] = []
    const shouldStopTraversal = async () => refs.length >= amount && amount !== -1
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

  private async fetchEntry<D = T>(hash: string): Promise<EntryInstance<D> | null> {
    return await this.get<D>(hash)
  }
}
