import { deepEqual, strictEqual } from 'node:assert'
import { basename, dirname, join } from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterEach, beforeEach, describe, it } from 'vitest'

import {
  ComposedStorage,
  Database,
  IPFSBlockStorage,
  Identities,
  KeyStore,
  MemoryStorage,
} from '../src'

import testKeysPath from './fixtures/test-keys-path'
import connectPeers from './utils/connect-nodes'
import createHelia from './utils/create-helia'
import waitFor from './utils/wait-for'

import type { DatabaseInstance } from '../src/database'
import type { IdentitiesInstance, IdentityInstance } from '../src/identities'
import type { KeyStoreInstance } from '../src/key-store'
import type { EntryInstance } from '../src/oplog/index'
import type { HeliaInstance } from '../src/vendor'

const testsPath = join(
  dirname(__filename),
  '.orbitdb/tests',
  basename(__filename, 'test.ts'),
)

describe('database - Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStoreInstance
  let identities: IdentitiesInstance
  let identities2: IdentitiesInstance
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let db1: DatabaseInstance<Uint8Array>, db2: DatabaseInstance<Uint8Array>

  const databaseId = 'documents-AAA'

  const accessController = {
    type: 'basic',
    write: ['*'],
    canAppend: async (entry: EntryInstance) => {
      const identity1 = entry.identity && await identities.getIdentity(entry.identity)
      const identity2 = entry.identity && await identities2.getIdentity(entry.identity)

      if (!identity1 || !identity2) {
        return false
      }

      return (
        identity1?.id === testIdentity1.id || identity2?.id === testIdentity2.id
      )
    },
  }

  beforeEach(async () => {
    [ipfs1, ipfs2] = await Promise.all([
      createHelia({
        directory: join(testsPath, '1', 'ipfs'),
      }),
      createHelia({
        directory: join(testsPath, '2', 'ipfs'),
      }),
    ])
    await connectPeers(ipfs1, ipfs2)

    await copy(testKeysPath, join(testsPath, '1', 'keystore'))
    keystore = await KeyStore.create({ path: join(testsPath, '1', 'keystore') })
    identities = await Identities.create({ keystore, ipfs: ipfs1 })
    identities2 = await Identities.create({ keystore, ipfs: ipfs2 })
    testIdentity1 = await identities.createIdentity({ id: 'userA' })
    testIdentity2 = await identities2.createIdentity({ id: 'userB' })
  })

  afterEach(async () => {
    if (db1) {
      await db1.drop()
      await db1.close()
    }
    if (db2) {
      await db2.drop()
      await db2.close()
    }

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

  describe('replicate across peers', () => {
    beforeEach(async () => {
      db1 = await Database.create({
        ipfs: ipfs1,
        identity: testIdentity1,
        address: databaseId,
        name: 'test',
        accessController,
        directory: join(testsPath, '1', 'orbitdb'),
      })
    })

    it('replicates databases across two peers', async () => {
      let replicated = false
      let expectedEntryHash: null | string = null
      const onConnected = (customEvent: CustomEvent) => {
        const { heads } = customEvent.detail
        replicated = expectedEntryHash !== null
        && heads.map((e: EntryInstance) => e.hash)
          .includes(expectedEntryHash)
      }

      const onUpdate = (customEvent: CustomEvent) => {
        const { entry } = customEvent.detail
        replicated = expectedEntryHash !== null
        && entry.hash === expectedEntryHash
      }

      db2 = await Database.create({
        ipfs: ipfs2,
        identity: testIdentity2,
        address: databaseId,
        name: 'test2',
        accessController,
        directory: join(testsPath, '2', 'orbitdb'),
      })

      db2.sync.events.addEventListener('join', onConnected)
      db2.events.addEventListener('update', onUpdate)

      await db1.addOperation({ op: 'PUT', key: '1', value: 'record 1 on db 1' })
      await db1.addOperation({ op: 'PUT', key: '2', value: 'record 2 on db 1' })
      await db1.addOperation({ op: 'PUT', key: '3', value: 'record 3 on db 1' })

      expectedEntryHash = await db1.addOperation({
        op: 'PUT',
        key: '4',
        value: 'record 4 on db 1',
      })

      await waitFor(
        async () => replicated,
        async () => true,
      )

      const all1: EntryInstance[] = []
      for await (const item of db1.log.iterator()) {
        all1.unshift(item)
      }

      const all2: EntryInstance[] = []
      for await (const item of db2.log.iterator()) {
        all2.unshift(item)
      }

      deepEqual(all1, all2)
    })

    it('replicates databases across two peers with delays', async () => {
      let replicated: boolean | string | null = false
      let expectedEntryHash: null | string = null

      const onConnected = (event: CustomEvent) => {
        const { heads } = event.detail
        replicated = expectedEntryHash
        && heads.map((e: EntryInstance) => e.hash)
          .includes(expectedEntryHash)
      }

      const onUpdate = (event: CustomEvent) => {
        const { entry } = event.detail
        replicated = expectedEntryHash && entry.hash === expectedEntryHash
      }

      db2 = await Database.create({
        ipfs: ipfs2,
        identity: testIdentity2,
        address: databaseId,
        accessController,
        directory: join(testsPath, '2', 'orbitdb'),
      })

      db2.sync.events.addEventListener('join', onConnected)
      db2.events.addEventListener('update', onUpdate)

      await db1.addOperation({ op: 'PUT', key: '1', value: 'record 1 on db 1' })

      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1000)
      })

      await db1.addOperation({ op: 'PUT', key: '2', value: 'record 2 on db 1' })
      await db1.addOperation({ op: 'PUT', key: '3', value: 'record 3 on db 1' })

      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1000)
      })

      expectedEntryHash = await db1.addOperation({
        op: 'PUT',
        key: '4',
        value: 'record 4 on db 1',
      })

      await waitFor(
        async () => replicated as boolean,
        async () => true,
      )

      const all1: EntryInstance[] = []
      for await (const item of db1.log.iterator()) {
        all1.unshift(item)
      }

      const all2: EntryInstance[] = []
      for await (const item of db2.log.iterator()) {
        all2.unshift(item)
      }

      deepEqual(all1, all2)
    })

    it('adds an operation before db2 is instantiated', async () => {
      let connected = false

      const onConnected = () => {
        connected = true
      }

      await db1.addOperation({ op: 'PUT', key: '1', value: 'record 1 on db 1' })

      db2 = await Database.create({
        ipfs: ipfs2,
        identity: testIdentity2,
        address: databaseId,
        accessController: {
          type: 'test',
          write: [] as any,
          canAppend: async () => true,
        },
        directory: join(testsPath, '2', 'orbitdb'),
      })

      db2.sync.events.addEventListener('join', onConnected)

      await waitFor(
        async () => connected,
        async () => true,
      )

      const all1: EntryInstance[] = []
      for await (const item of db1.log.iterator()) {
        all1.unshift(item)
      }

      const all2: EntryInstance[] = []
      for await (const item of db2.log.iterator()) {
        all2.unshift(item)
      }

      deepEqual(all1, all2)
    })
  })

  describe('options', () => {
    it('uses given ComposedStorage with MemoryStorage/IPFSBlockStorage for entryStorage', async () => {
      const storage1 = ComposedStorage.create<Uint8Array>({
        storage1: MemoryStorage.create(),
        storage2: IPFSBlockStorage.create({ ipfs: ipfs1, pin: true }),
      },
      )
      const storage2 = ComposedStorage.create<Uint8Array>({
        storage1: MemoryStorage.create(),
        storage2: IPFSBlockStorage.create({ ipfs: ipfs2, pin: true }),
      })
      db1 = await Database.create({
        ipfs: ipfs1,
        identity: testIdentity1,
        address: databaseId,
        accessController,
        directory: join(testsPath, '1', 'orbitdb'),
        entryStorage: storage1,
      })
      db2 = await Database.create({
        ipfs: ipfs2,
        identity: testIdentity2,
        address: databaseId,
        accessController,
        directory: join(testsPath, '2', 'orbitdb'),
        entryStorage: storage2,
      })

      let connected1 = false
      let connected2 = false

      const onConnected1 = () => {
        connected1 = true
      }

      const onConnected2 = () => {
        connected2 = true
      }

      db1.sync.events.addEventListener('join', onConnected1)
      db2.sync.events.addEventListener('join', onConnected2)

      await db1.addOperation({ op: 'PUT', key: String(1), value: 'record 1 on db 1' })
      await db1.addOperation({ op: 'PUT', key: String(2), value: 'record 2 on db 1' })
      await db1.addOperation({ op: 'PUT', key: String(3), value: 'record 3 on db 1' })
      await db1.addOperation({ op: 'PUT', key: String(4), value: 'record 4 on db 1' })

      await waitFor(
        async () => connected1,
        async () => true,
      )
      await waitFor(
        async () => connected2,
        async () => true,
      )

      const all1: EntryInstance[] = []
      for await (const item of db1.log.iterator()) {
        all1.unshift(item)
      }

      const all2: EntryInstance[] = []
      for await (const item of db2.log.iterator()) {
        all2.unshift(item)
      }

      deepEqual(all1, all2)
    })
  })

  describe('events', () => {
    beforeEach(async () => {
      db1 = await Database.create({
        ipfs: ipfs1,
        identity: testIdentity1,
        address: databaseId,
        accessController,
        directory: join(testsPath, '1', 'orbitdb'),
      })
      db2 = await Database.create({
        ipfs: ipfs2,
        identity: testIdentity2,
        address: databaseId,
        accessController,
        directory: join(testsPath, '2', 'orbitdb'),
      })
    })

    it('emits \'update\' once when one operation is added', async () => {
      const expected = 1
      let connected1 = false
      let connected2 = false
      let updateCount1 = 0
      let updateCount2 = 0

      const onConnected2 = () => {
        connected2 = true
      }

      const onUpdate1 = async () => {
        ++updateCount1
      }

      const onUpdate2 = async () => {
        ++updateCount2
      }

      db1.sync.events.addEventListener('join', () => {
        connected1 = true
      })
      db2.sync.events.addEventListener('join', onConnected2)
      db1.events.addEventListener('update', onUpdate1)
      db2.events.addEventListener('update', onUpdate2)

      await waitFor(
        async () => connected1,
        async () => true,
      )
      await waitFor(
        async () => connected2,
        async () => true,
      )

      await db1.addOperation({ op: 'PUT', key: '1', value: 'record 1 on db 1' })

      await waitFor(
        async () => updateCount1 >= expected,
        async () => true,
      )
      await waitFor(
        async () => updateCount2 >= expected,
        async () => true,
      )

      strictEqual(updateCount1, expected)
      strictEqual(updateCount2, expected)
    })

    it('emits \'update\' 4 times when 4 documents are added', async () => {
      const expected = 4
      let connected1 = false
      let connected2 = false
      let updateCount1 = 0
      let updateCount2 = 0

      const onConnected1 = async () => {
        connected1 = true
      }

      const onConnected2 = async () => {
        connected2 = true
      }

      const onUpdate1 = async () => {
        ++updateCount1
      }

      const onUpdate2 = async () => {
        ++updateCount2
      }

      db1.sync.events.addEventListener('join', onConnected1)
      db2.sync.events.addEventListener('join', onConnected2)
      db1.events.addEventListener('update', onUpdate1)
      db2.events.addEventListener('update', onUpdate2)

      await waitFor(
        async () => connected1,
        async () => true,
      )
      await waitFor(
        async () => connected2,
        async () => true,
      )

      await db1.addOperation({ op: 'PUT', key: '1', value: '11' })
      await db1.addOperation({ op: 'PUT', key: '2', value: '22' })
      await db1.addOperation({ op: 'PUT', key: '3', value: '33' })
      await db1.addOperation({ op: 'PUT', key: '4', value: '44' })

      await waitFor(
        async () => updateCount1 >= expected,
        async () => true,
      )
      await waitFor(
        async () => updateCount2 >= expected,
        async () => true,
      )

      strictEqual(updateCount1, expected)
      strictEqual(updateCount2, expected)
    })
  })
})
