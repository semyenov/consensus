/* eslint-disable no-console */
import { deepStrictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'

import {
  Events,
  Identities,
  KeyStore,
} from '../../../src'
import testKeysPath from '../../fixtures/test-keys-path'
import connectPeers from '../../utils/connect-nodes'
import createHelia from '../../utils/create-helia'
import waitFor from '../../utils/wait-for'

import type { EventsInstance } from '../../../src/databases/events'
import type { IdentitiesInstance, IdentityInstance } from '../../../src/identities'
import type { KeyStoreInstance } from '../../../src/key-store'
import type { EntryInstance } from '../../../src/oplog'
import type { HeliaInstance } from '../../../src/vendor'

const keysPath = './.orbitdb/keystore'

describe('events Database Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStoreInstance
  let identities: IdentitiesInstance
  let identities2: IdentitiesInstance
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let db1: EventsInstance, db2: EventsInstance

  const databaseId = 'events-AAA'

  const accessController = {
    canAppend: async (entry: EntryInstance) => {
      const identity = await identities.getIdentity(entry.identity!)
      if (!identity) {
        throw new Error('Identity not found')
      }

      return identity.id === testIdentity1.id
    },
  }

  const expected = [
    'init',
    true,
    'hello',
    'friend',
    12345,
    'empty',
    '',
    'friend33',
  ]

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([createHelia(), createHelia()])
    await connectPeers(ipfs1, ipfs2)

    await copy(testKeysPath, keysPath)
    keystore = await KeyStore.create({ path: keysPath })
    identities = await Identities.create({ keystore, ipfs: ipfs1 })
    identities2 = await Identities.create({ keystore, ipfs: ipfs2 })
    testIdentity1 = await identities.createIdentity({ id: 'userA' })
    testIdentity2 = await identities2.createIdentity({ id: 'userB' })
  })

  afterEach(async () => {
    if (db1) {
      await db1.drop()
      await db1.close()
      db1 = null as unknown as EventsInstance
    }
    if (db2) {
      await db2.drop()
      await db2.close()
      db2 = null as unknown as EventsInstance
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
    await rimraf('./.orbitdb/orbitdb1')
    await rimraf('./.orbitdb/orbitdb2')
    await rimraf('./.ipfs1')
    await rimraf('./.ipfs2')
  })

  it('replicates a database', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    db1 = await Events.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb1',
    })
    db2 = await Events.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
    })

    db2.sync.events.addEventListener('join', (event: CustomEvent) => {
      const { heads } = event.detail
      replicated = expectedEntryHash !== null && heads.map((e: EntryInstance) => e.hash)
        .includes(expectedEntryHash)
    })
    db2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated = expectedEntryHash !== null && entry.hash === expectedEntryHash
    })

    await db1.add(expected[0])
    await db1.add(expected[1])
    await db1.add(expected[2])
    await db1.add(expected[3])
    await db1.add(expected[4])
    await db1.add(expected[5])
    await db1.add(expected[6])
    expectedEntryHash = await db1.add(expected[7])

    await waitFor(() => replicated, () => true)

    const all2: { key?: string, value: any }[] = []
    for await (const event of db2.iterator()) {
      all2.unshift(event as { key?: string, value: any })
    }
    deepStrictEqual(all2.map(e => e.value), expected)

    const all1 = await db2.all()
    deepStrictEqual(all1.map((e: any) => e.value), expected)
  })

  it('loads the database after replication', async () => {
    let replicated = false
    let expectedEntryHash: string | null = null

    db1 = await Events.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb1',
    })
    db2 = await Events.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
    })

    db2.sync.events.addEventListener('join', (event: CustomEvent) => {
      const { heads } = event.detail
      replicated = expectedEntryHash !== null && heads.map((e: EntryInstance) => e.hash)
        .includes(expectedEntryHash)
    })
    db2.events.addEventListener('update', (event: CustomEvent) => {
      const { entry } = event.detail
      replicated = expectedEntryHash !== null && entry.hash === expectedEntryHash
    })

    db2.events.addEventListener('error', (err) => {
      console.error(err)
    })
    db1.events.addEventListener('error', (err) => {
      console.error(err)
    })

    await db1.add(expected[0])
    await db1.add(expected[1])
    await db1.add(expected[2])
    await db1.add(expected[3])
    await db1.add(expected[4])
    await db1.add(expected[5])
    await db1.add(expected[6])
    expectedEntryHash = await db1.add(expected[7])

    await waitFor(() => replicated, () => true)

    await db1.drop()
    await db1.close()
    db1 = null as unknown as EventsInstance

    await db2.close()

    db2 = await Events.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      accessController,
      directory: './.orbitdb/orbitdb2',
    })

    const all2: { key?: string, value: any }[] = []
    for await (const event of db2.iterator()) {
      all2.unshift(event as { key?: string, value: any })
    }
    deepStrictEqual(all2.map(e => e.value), expected)

    const all1 = await db2.all()
    deepStrictEqual(all1.map((e: any) => e.value), expected)
  })
})
