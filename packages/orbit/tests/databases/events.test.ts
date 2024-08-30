// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import { deepStrictEqual, strictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Events,
  Identities,
  KeyStore,
} from '../../src'
import testKeysPath from '../fixtures/test-keys-path.js'
import createHelia from '../utils/create-helia.js'

import type {
  AccessControllerInstance,
  EventsDoc,
  EventsInstance,
  IPFS,
  IdentitiesInstance,
  IdentityInstance,
  KeyStoreInstance,
} from '@orbitdb/core'

const keysPath = './testkeys'
describe('events Database', () => {
  let ipfs: IPFS
  let keystore: KeyStoreInstance
  let accessController: AccessControllerInstance
  let identities: IdentitiesInstance
  let testIdentity1: IdentityInstance
  let db: EventsInstance

  const databaseId = 'events-AAA'

  beforeAll(async () => {
    ipfs = await createHelia()

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
    await rimraf('./orbitdb')
    await rimraf('./ipfs1')
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

    const all = await db.all()

    deepStrictEqual(all.map((e) => {
      return e.value
    }), events)
  })

  describe('iterator Options', () => {
    let hashes: string[] = []
    const last = (arr) => {
      return arr[arr.length - 1]
    }
    const first = (arr) => {
      return arr[0]
    }

    beforeEach(async () => {
      hashes = await Promise.all(
        [0, 1, 2, 3, 4].map((i) => {
          return db.add(`hello${i}`)
        }),
      )
    })

    describe('amount', () => {
      it('returns one item', async () => {
        const expected = ['hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ amount: 1 })) {
          all.unshift(record)
        }

        strictEqual(all.length, 1)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns two items', async () => {
        const expected = ['hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ amount: 2 })) {
          all.unshift(record)
        }

        strictEqual(all.length, 2)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns three items', async () => {
        const expected = ['hello2', 'hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ amount: 3 })) {
          all.unshift(record)
        }

        strictEqual(all.length, 3)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('sets \'amount\' greater than items available', async () => {
        const expected = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ amount: 100 })) {
          all.unshift(record)
        }

        strictEqual(all.length, 5)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('sets \'amount\' to 0', async () => {
        const expected = []

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ amount: 0 })) {
          all.unshift(record)
        }

        strictEqual(all.length, 0)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })

    describe('lt', () => {
      it('returns all items less than head', async () => {
        const expected = ['hello0', 'hello1', 'hello2', 'hello3']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ lt: last(hashes) })) {
          all.unshift(record)
        }

        strictEqual(all.length, 4)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns one item less than head', async () => {
        const expected = ['hello3']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ lt: last(hashes), amount: 1 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 1)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns two items less than head', async () => {
        const expected = ['hello2', 'hello3']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ lt: last(hashes), amount: 2 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 2)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })

    describe('lte', () => {
      it('returns all items less or equal to head', async () => {
        const expected = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ lte: last(hashes) })) {
          all.unshift(record)
        }

        strictEqual(all.length, 5)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns one item less than or equal to head', async () => {
        const expected = ['hello4']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ lte: last(hashes), amount: 1 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 1)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns two items less than or equal to head', async () => {
        const expected = ['hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ lte: last(hashes), amount: 2 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 2)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })

    describe('gt', () => {
      it('returns all items greater than root', async () => {
        const expected = ['hello1', 'hello2', 'hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ gt: first(hashes) })) {
          all.unshift(record)
        }

        strictEqual(all.length, 4)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns one item greater than root', async () => {
        const expected = ['hello1']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ gt: first(hashes), amount: 1 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 1)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns two items greater than root', async () => {
        const expected = ['hello1', 'hello2']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ gt: first(hashes), amount: 2 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 2)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })

    describe('gte', () => {
      it('returns all items greater than or equal to root', async () => {
        const expected = ['hello0', 'hello1', 'hello2', 'hello3', 'hello4']

        const all: EventsDoc[] = []
        for await (const record of db.iterator({ gte: first(hashes) })) {
          all.unshift(record)
        }

        strictEqual(all.length, 5)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns one item greater than or equal to root', async () => {
        const expected = ['hello0']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ gte: first(hashes), amount: 1 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 1)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })

      it('returns two items greater than or equal to root', async () => {
        const expected = ['hello0', 'hello1']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ gte: first(hashes), amount: 2 })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 2)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })

    describe('range', async () => {
      it('returns all items greater than root and less than head', async () => {
        const expected = ['hello1', 'hello2', 'hello3']

        const all: EventsDoc[] = []
        for await (
          const record of db.iterator({ gt: first(hashes), lt: last(hashes) })
        ) {
          all.unshift(record)
        }

        strictEqual(all.length, 3)
        deepStrictEqual(all.map((e) => {
          return e.value
        }), expected)
      })
    })
  })
})
