import { deepStrictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'

import { Identities, KeyStore, KeyValue } from '../../../src'
import testKeysPath from '../../fixtures/test-keys-path'
import connectPeers from '../../utils/connect-nodes'
import createHelia from '../../utils/create-helia'
import waitFor from '../../utils/wait-for'

import type { AccessControllerInstance } from '../../../src/access-controllers'
import type { KeyValueDatabase } from '../../../src/databases/keyvalue'
import type { IdentitiesInstance } from '../../../src/identities'
import type { IdentityInstance } from '../../../src/identities/identity'
import type { KeyStoreInstance } from '../../../src/key-store'
import type { EntryInstance } from '../../../src/oplog'
import type { HeliaInstance } from '../../../src/vendor'

const keysPath = './testkeys'

describe('keyValue Database Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStoreInstance
  let identities: IdentitiesInstance
  let accessController: AccessControllerInstance
  let identities2: IdentitiesInstance
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let kv1: KeyValueDatabase, kv2: KeyValueDatabase

  const databaseId = 'kv-AAA'

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([createHelia(), createHelia()])
    await connectPeers(ipfs1, ipfs2)

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

    await rimraf(keysPath)
    await rimraf('./.out')
    await rimraf('./ipfs1')
    await rimraf('./ipfs2')
  })

  it('replicates a database', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    const onConnected = (event: CustomEvent) => {
      const { heads } = event.detail
      replicated
        = expectedEntryHash !== null
        && heads.map((e: EntryInstance) => e.hash)
          .includes(expectedEntryHash)
    }

    const onUpdate = (event: CustomEvent) => {
      const { entry } = event.detail
      replicated
        = expectedEntryHash !== null && entry.hash === expectedEntryHash
    }

    kv1 = await KeyValue.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb1',
    })
    kv2 = await KeyValue.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
    })

    kv2.sync.events.addEventListener('join', onConnected)
    kv2.events.addEventListener('update', onUpdate)

    await kv1.set('init', true)
    await kv1.set('hello', 'friend')
    await kv1.del('hello')
    await kv1.set('hello', 'friend2')
    await kv1.del('hello')
    await kv1.set('empty', '')
    await kv1.del('empty')
    expectedEntryHash = await kv1.set('hello', 'friend3')

    await waitFor(
      () => replicated,
      () => true,
    )

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
      all2.push({ key: keyValue.key as string, value: keyValue.value })
    }
    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'hello', value: 'friend3' },
        { key: 'init', value: true },
      ],
    )

    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push({ key: keyValue.key as string, value: keyValue.value })
    }
    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'hello', value: 'friend3' },
        { key: 'init', value: true },
      ],
    )
  })

  it('loads the database after replication', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    const onConnected = (event: CustomEvent) => {
      const { heads } = event.detail
      replicated
        = expectedEntryHash !== null
        && heads.map((e: EntryInstance) => e.hash)
          .includes(expectedEntryHash)
    }

    const onUpdate = (event: CustomEvent) => {
      const { entry } = event.detail
      replicated
        = expectedEntryHash !== null && entry.hash === expectedEntryHash
    }

    kv1 = await KeyValue.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb1',
    })
    kv2 = await KeyValue.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
    })

    kv2.events.addEventListener('join', onConnected)
    kv1.events.addEventListener('join', onConnected)
    kv2.events.addEventListener('update', onUpdate)

    await kv1.set('init', true)
    await kv1.set('hello', 'friend')
    await kv1.del('hello')
    await kv1.set('hello', 'friend2')
    await kv1.del('hello')
    await kv1.set('empty', '')
    await kv1.del('empty')
    expectedEntryHash = await kv1.set('hello', 'friend3')

    await waitFor(
      () => replicated,
      () => true,
    )

    await kv1.close()
    await kv2.close()

    kv1 = await KeyValue.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb1',
    })
    kv2 = await KeyValue.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
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
      all2.push({ key: keyValue.key as string, value: keyValue.value })
    }
    deepStrictEqual(
      all2.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'hello', value: 'friend3' },
        { key: 'init', value: true },
      ],
    )

    const all1: { key: string, value: any }[] = []
    for await (const keyValue of kv1.iterator()) {
      all1.push({ key: keyValue.key as string, value: keyValue.value })
    }
    deepStrictEqual(
      all1.map(e => ({ key: e.key, value: e.value })),
      [
        { key: 'hello', value: 'friend3' },
        { key: 'init', value: true },
      ],
    )
  })
})
