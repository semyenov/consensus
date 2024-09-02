import { deepStrictEqual, strictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Events,
  Identities,
  KeyStore,
} from '../../src'
import testKeysPath from '../fixtures/test-keys-path'
import createHelia from '../utils/create-helia'

import type { AccessControllerInstance } from '../../src/access-controllers'
import type { EventsDoc, EventsInstance } from '../../src/databases/events'
import type { IdentitiesInstance, IdentityInstance } from '../../src/identities'
import type { KeyStoreInstance } from '../../src/key-store'
import type { EntryInstance } from '../../src/oplog'
import type { HeliaInstance } from '../../src/vendor'

const keysPath = './.orbitdb/keystore'

describe('events Database', () => {
  let ipfs: HeliaInstance
  let keystore: KeyStoreInstance
  let accessController: AccessControllerInstance
  let identities: IdentitiesInstance
  let testIdentity1: IdentityInstance
  let db: EventsInstance
  const hashes: string[] = []

  const databaseId = 'events-AAA'

  beforeAll(async () => {
    ipfs = await createHelia()

    accessController = {
      type: 'basic',
      write: ['*'],
      canAppend: async (entry: EntryInstance) => {
        const identity = await identities.getIdentity(entry.identity!)
        if (!identity) {
          throw new Error('Identity not found')
        }

        return identity.id === testIdentity1.id
      },
    }

    await copy(testKeysPath, keysPath)

    keystore = await KeyStore.create({ path: keysPath })
    identities = await Identities.create({ keystore, ipfs })
    testIdentity1 = await identities.createIdentity({ id: 'userA' })
  })

  beforeEach(async () => {
    db = await Events.create({
      ipfs,
      identity: testIdentity1,
      address: databaseId,
      accessController,
    })
  })
  afterEach(async () => {
    if (db) {
      await db.drop()
      await db.close()
    }
  })

  afterAll(async () => {
    if (ipfs) {
      await ipfs.stop()
    }

    if (keystore) {
      await keystore.close()
    }

    await rimraf(keysPath)
    await rimraf('./.orbitdb')
  })

  it('creates an event store', async () => {
    strictEqual(db.address?.toString(), databaseId)
    strictEqual(db.type, 'events')
  })

  it('adds an event', async () => {
    const expected = 'init'

    const hash = await db.add(expected)

    const actual = await db.get(hash)
    strictEqual(actual, expected)
  })

  it('gets an event', async () => {
    const expected = 'init'

    const hash = await db.add(expected)

    const actual = await db.get(hash)
    strictEqual(actual, expected)
  })

  it('returns all events', async () => {
    const events = [
      'init',
      true,
      'hello',
      'friend',
      '12345',
      'empty',
      'friend33',
    ]

    for (const record of events) {
      await db.add(record)
    }

    const all = await db.all<EventsDoc>()

    deepStrictEqual(all.map(e => e.value), events)
  })

  it('amount: returns one item', async () => {
    const expected: any[] = ['hello4']

    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ amount: 1 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 1)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('amount: returns two items', async () => {
    const expected: any[] = ['hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ amount: 2 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 2)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('amount: returns three items', async () => {
    const expected: any[] = ['hello2', 'hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ amount: 3 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 3)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('amount: sets \'amount\' greater than items available', async () => {
    const expected: any[] = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ amount: 100 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 5)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('amount: sets \'amount\' to 0', async () => {
    const expected: any[] = []
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ amount: 0 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 0)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lt: returns all items less than head', async () => {
    const expected: any[] = ['hello0', 'hello1', 'hello2', 'hello3']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ lt: last(hashes), amount: 100 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 4)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lt: returns one item less than head', async () => {
    const expected: any[] = ['hello3']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ lt: last(hashes), amount: 1 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 1)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lt: returns two items less than head', async () => {
    const expected: any[] = ['hello2', 'hello3']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ lt: last(hashes), amount: 2 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 2)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lte: returns all items less or equal to head', async () => {
    const expected: any[] = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ lte: last(hashes), amount: 100 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 5)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lte: returns one item less than or equal to head', async () => {
    const expected: any[] = ['hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ lte: last(hashes), amount: 1 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 1)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('lte: returns two items less than or equal to head', async () => {
    const expected: any[] = ['hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ lte: last(hashes), amount: 2 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 2)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gt: returns all items greater than root', async () => {
    const expected: any[] = ['hello1', 'hello2', 'hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ gt: first(hashes), amount: 100 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 4)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gt: returns one item greater than root', async () => {
    const expected: any[] = ['hello1']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ gt: first(hashes), amount: 1 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 1)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gt: returns two items greater than root', async () => {
    const expected: any[] = ['hello1', 'hello2']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ gt: first(hashes), amount: 2 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 2)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gte: returns all items greater than or equal to root', async () => {
    const expected: any[] = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (const record of db.iterator<EventsDoc>({ gte: first(hashes), amount: 100 })) {
      all.unshift(record)
    }

    strictEqual(all.length, 5)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gte: returns one item greater than or equal to root', async () => {
    const expected: any[] = ['hello0']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ gte: first(hashes), amount: 1 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 1)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('gte: returns two items greater than or equal to root', async () => {
    const expected: any[] = ['hello0', 'hello1']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ gte: first(hashes), amount: 2 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 2)
    deepStrictEqual(all.map(e => e.value), expected)
  })

  it('range: returns all items greater than root and less than head', async () => {
    const expected: any[] = ['hello1', 'hello2', 'hello3']
    for (const i of [0, 1, 2, 3, 4]) {
      await db.add(`hello${i}`)
    }

    const all: EventsDoc[] = []
    for await (
      const record of db.iterator<EventsDoc>({ gt: first(hashes), lt: last(hashes), amount: 100 })
    ) {
      all.unshift(record)
    }

    strictEqual(all.length, 3)
    deepStrictEqual(all.map(e => e.value), expected)
  })
})

function last(arr: any[]) {
  return arr[arr.length - 1]
}

function first(arr: any[]) {
  return arr[0]
}
