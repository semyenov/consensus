/* eslint-disable no-console */
import { deepStrictEqual } from 'node:assert'
import { basename, dirname, join } from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'

import {
  Identities,
  KeyStore,
  KeyValueIndexed,
} from '../../../src'
import testKeysPath from '../../fixtures/test-keys-path'
import connectPeers from '../../utils/connect-nodes'
import createHelia from '../../utils/create-helia'
import waitFor from '../../utils/wait-for'

import type { AccessControllerInstance } from '../../../src/access-controllers'
import type { KeyValueIndexedDatabase } from '../../../src/databases/keyvalue-indexed'
import type { IdentityInstance } from '../../../src/identities/identity'
import type { EntryInstance } from '../../../src/oplog'
import type { HeliaInstance } from '../../../src/vendor'

const testsPath = join(
  dirname(__filename),
  '.orbitdb/tests',
  basename(__filename, '.test.ts'),
)

describe('keyValueIndexed Database Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStore
  let identities: Identities
  let identities2: Identities
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let kv1: KeyValueIndexedDatabase, kv2: KeyValueIndexedDatabase

  const databaseId = 'kv-AAA'

  const accessController: AccessControllerInstance = {
    type: 'basic',
    write: ['*'],
    canAppend: async (entry) => {
      const identity = await identities.getIdentity(entry.identity!)
      if (!identity) {
        throw new Error('Identity not found')
      }

      return identity.id === testIdentity1.id
        || identity.id === testIdentity2.id
    },
  }

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([
      createHelia({ directory: join(testsPath, '1', 'ipfs') }),
      createHelia({ directory: join(testsPath, '2', 'ipfs') }),
    ])
    await connectPeers(ipfs1, ipfs2)

    await rimraf(testsPath)

    await copy(testKeysPath, join(testsPath, 'keystore'))
    keystore = await KeyStore.create({ path: join(testsPath, 'keystore') })
    identities = await Identities.create({ keystore, ipfs: ipfs1 })
    identities2 = await Identities.create({ keystore, ipfs: ipfs2 })
    testIdentity1 = await identities.createIdentity({ id: 'userA' })
    testIdentity2 = await identities2.createIdentity({ id: 'userB' })
  })
  afterEach(async () => {
    if (kv1) {
      await kv1.drop()
      await kv1.close()
    }
    if (kv2) {
      await kv2.drop()
      await kv2.close()
    }
  })

  afterAll(async () => {
    if (ipfs1) {
      await ipfs1.stop()
    }

    if (ipfs2) {
      await ipfs2.stop()
    }

    if (keystore) {
      await keystore.close()
    }

    await rimraf(testsPath)
  })

  it('replicates a database', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })
    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    kv2.sync.events.addEventListener('join', (event: CustomEvent) => {
      const { heads } = event.detail
      replicated = expectedEntryHash !== null
      && heads.map((e: EntryInstance) => e.hash)
        .includes(expectedEntryHash)
    })
    kv2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated = expectedEntryHash !== null
      && entry.hash === expectedEntryHash
    })

    await kv1.put('init', true)
    await kv1.put('hello', 'friend')
    await kv1.del('hello')
    await kv1.put('hello', 'friend2')
    await kv1.del('hello')
    await kv1.put('empty', '')
    await kv1.del('empty')
    expectedEntryHash = await kv1.put('hello', 'friend3')

    await waitFor(() => replicated, () => true)

    const value0 = await kv2.get('init')
    deepStrictEqual(value0, true)

    const value2 = await kv2.get('hello')
    deepStrictEqual(value2, 'friend3')

    const value1 = await kv1.get('hello')
    deepStrictEqual(value1, 'friend3')

    const value9 = await kv1.get('empty')
    deepStrictEqual(value9, null)

    const all2: { key: string, value: any }[] = []
    for await (const keyValue of kv2.iterator()) {
      all2.push(keyValue)
    }
    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
      ],
    )
    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push(keyValue)
    }
    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
      ],
    )
  })

  it('loads the database after replication', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })
    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    kv2.sync.events.addEventListener('join', (event: CustomEvent) => {
      const { heads } = event.detail
      replicated = expectedEntryHash !== null
      && heads.map((e: EntryInstance) => e.hash)
        .includes(expectedEntryHash)
    })
    kv2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated = expectedEntryHash !== null
      && entry.hash === expectedEntryHash
    })

    kv2.events.addEventListener('error', (err) => {
      console.error(err)
    })
    kv1.events.addEventListener('error', (err) => {
      console.error(err)
    })

    await kv1.put('init', true)
    await kv1.put('hello', 'friend')
    await kv1.del('hello')
    await kv1.put('hello', 'friend2')
    await kv1.del('hello')
    await kv1.put('empty', '')
    await kv1.del('empty')
    expectedEntryHash = await kv1.put('hello', 'friend3')

    await waitFor(
      async () => replicated,
      async () => true,
    )

    await kv1.close()
    await kv2.close()

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })
    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    const value0 = await kv2.get('init')
    deepStrictEqual(value0, true)

    const value2 = await kv2.get('hello')
    deepStrictEqual(value2, 'friend3')

    const value1 = await kv1.get('hello')
    deepStrictEqual(value1, 'friend3')

    const value9 = await kv1.get('empty')
    deepStrictEqual(value9, null)

    const all2: { key: string, value: any }[] = []
    for await (const keyValue of kv2.iterator()) {
      all2.push(keyValue)
    }
    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
      ],
    )

    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push(keyValue)
    }
    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
      ],
    )
  })

  it('indexes the database correctly', async () => {
    let replicated1: string | boolean = false
    let replicated2: string | boolean = false
    let replicated3: string | boolean = false
    let expectedEntryHash1: string | null = null
    let expectedEntryHash2: string | null = null
    let expectedEntryHash3: string | null = null

    const onError = (err: any) => {
      console.error(err)
      deepStrictEqual(err, null)
    }

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })
    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    kv2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated1 = expectedEntryHash1 !== null && entry.hash === expectedEntryHash1
    })

    kv2.events.addEventListener('error', onError)
    kv1.events.addEventListener('error', onError)

    await kv1.put('init', true)
    await kv1.put('hello', 'friend')
    await kv1.del('hello')
    await kv1.put('hello', 'friend2')
    await kv1.del('hello')
    await kv1.put('empty', '')
    await kv1.del('empty')
    expectedEntryHash1 = await kv1.put('hello', 'friend3')

    await waitFor(
      async () => replicated1,
      async () => true,
    )

    await kv1.close()

    await kv2.put('A', 'AAA')
    await kv2.put('B', 'BBB')
    expectedEntryHash3 = await kv2.put('C', 'CCC')

    await kv2.close()

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })

    const onUpdate3 = async (event: CustomEvent) => {
      const { entry } = event.detail
      replicated3 = expectedEntryHash3 && entry.hash === expectedEntryHash3
    }

    kv1.events.addEventListener('update', onUpdate3)
    kv1.events.addEventListener('error', onError)

    await kv1.put('one', 1)
    await kv1.put('two', 2)
    await kv1.put('three', 3)
    await kv1.del('three')
    expectedEntryHash2 = await kv1.put('four', 4)

    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    kv2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated2 = expectedEntryHash2 && entry.hash === expectedEntryHash2
    })
    kv2.events.addEventListener('error', onError)

    await waitFor(
      async () => replicated2 && replicated3,
      async () => true,
    )

    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push(keyValue)
    }

    const all2: { key: string, value: any }[] = []
    for await (const keyValue of kv2.iterator()) {
      all2.push(keyValue)
    }

    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'two', value: 2 },
        { key: 'one', value: 1 },
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
        { key: 'four', value: 4 },
        { key: 'C', value: 'CCC' },
        { key: 'B', value: 'BBB' },
        { key: 'A', value: 'AAA' },
      ],
    )

    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'two', value: 2 },
        { key: 'one', value: 1 },
        { key: 'init', value: true },
        { key: 'hello', value: 'friend3' },
        { key: 'four', value: 4 },
        { key: 'C', value: 'CCC' },
        { key: 'B', value: 'BBB' },
        { key: 'A', value: 'AAA' },
      ],
    )
  })

  it('indexes deletes correctly', async () => {
    let replicated = false

    kv1 = await KeyValueIndexed.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: join(testsPath, '1', 'orbitdb'),
    })

    kv1.events.addEventListener('error', (err) => {
      console.error(err)
      deepStrictEqual(err, null)
    })

    await kv1.put('init', true)
    await kv1.put('hello', 'friend')
    await kv1.del('delete')
    await kv1.put('delete', 'this value')
    await kv1.del('delete')

    kv2 = await KeyValueIndexed.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
    })

    kv2.events.addEventListener('update', () => {
      replicated = true
    })
    kv2.events.addEventListener('error', (err) => {
      console.error(err)
      deepStrictEqual(err, null)
    })

    await waitFor(
      async () => replicated,
      async () => true,
    )

    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push(keyValue)
    }

    const all2: { key: string, value: any }[] = []
    for await (const keyValue of kv2.iterator()) {
      all2.push(keyValue)
    }

    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend' },
      ],
    )

    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'init', value: true },
        { key: 'hello', value: 'friend' },
      ],
    )

    await rimraf(testsPath)
  })
})
