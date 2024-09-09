/* eslint-disable no-console */
import { deepStrictEqual, strictEqual } from 'node:assert'
import { existsSync, readdirSync } from 'node:fs'
import Path, { basename, dirname, join } from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import { Database, type DatabaseInstance } from '../src/database'
import { Identities, type IdentitiesInstance } from '../src/identities'
import { KeyStore, type KeyStoreInstance } from '../src/key-store'
import { Entry, type EntryInstance } from '../src/oplog'
import { LevelStorage, MemoryStorage } from '../src/storage'

import testKeysPath from './fixtures/test-keys-path'
import createHelia from './utils/create-helia'

import type { IdentityInstance } from '../src/identities/identity'
import type { HeliaInstance } from '../src/vendor'

const testsPath = join(
  dirname(__filename),
  '.orbitdb/tests',
  basename(__filename, '.test.ts'),
)
describe('database', () => {
  // this.timeout(30000)

  let ipfs: HeliaInstance
  let keystore: KeyStoreInstance
  let identities: IdentitiesInstance
  let testIdentity: IdentityInstance
  let db: DatabaseInstance<EntryInstance>

  const databaseId = 'database-AAA'

  const accessController = {
    type: 'basic',
    write: [],
    canAppend: async (entry: EntryInstance) => {
      const identity1 = await identities.getIdentity(entry.identity!)
      if (!identity1) {
        throw new Error('identity not found')
      }

      return identity1.id === testIdentity.id
    },
  }

  beforeAll(async () => {
    ipfs = await createHelia({ directory: join(testsPath, 'ipfs') })
    await copy(testKeysPath, join(testsPath, 'keystore'))
    keystore = await KeyStore.create({ path: join(testsPath, 'keystore') })
    identities = await Identities.create({ keystore, ipfs })
    testIdentity = await identities.createIdentity({ id: 'userA' })
  })

  afterEach(async () => {
    await rimraf(testsPath)
  })

  afterAll(async () => {
    if (ipfs) {
      await ipfs.stop()
    }

    if (keystore) {
      await keystore.close()
    }

    await rimraf(testsPath)
  })

  it('adds an operation', async () => {
    db = await Database.create({
      ipfs,
      identity: testIdentity,
      address: databaseId,
      accessController,
      directory: join(testsPath, 'orbitdb'),
    })
    const expected = 'zdpuB2YZc3bvZDu8kW6f6rb5JjKeMrNogyPhncci82hLCScdN'
    const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
    const actual = await db.addOperation(op)

    deepStrictEqual(actual, expected)

    await db.close()
  })

  describe('options', () => {
    it('uses default directory for headsStorage', async () => {
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: join(testsPath, 'orbitdb'),
      })
      const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      const headsPath = Path.join(
        join(testsPath, 'orbitdb'),
        `${databaseId}/`,
        '/log/_heads/',
      )

      console.log('headsPath', headsPath)
      console.log('process.cwd', readdirSync(join(testsPath, 'orbitdb')))

      strictEqual(await existsSync(headsPath), true)

      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash) as Uint8Array)).payload,
        op,
      )

      await headsStorage.close()

      await rimraf(headsPath)
    })

    it('uses given directory for headsStorage', async () => {
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: join(testsPath, 'custom-directory'),
      })
      const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      const headsPath = Path.join(
        join(testsPath, 'custom-directory'),
        `${databaseId}/`,
        '/log/_heads/',
      )

      strictEqual(await existsSync(headsPath), true)

      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash) as Uint8Array)).payload,
        op,
      )

      await headsStorage.close()

      await rimraf(headsPath)
      await rimraf(join(testsPath, 'custom-directory'))
    })

    it('uses given MemoryStorage for headsStorage', async () => {
      const headsStorage = MemoryStorage.create<Uint8Array>()
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: join(testsPath, 'orbitdb'),
        headsStorage,
      })
      const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash) as Uint8Array)).payload,
        op,
      )

      await db.close()
    })

    it('uses given MemoryStorage for entryStorage', async () => {
      const entryStorage = MemoryStorage.create<Uint8Array>()
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: join(testsPath, 'orbitdb'),
        entryStorage,
      })
      const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      deepStrictEqual(
        (await Entry.decode(await entryStorage.get(hash) as Uint8Array)).payload,
        op,
      )

      await db.close()
    })
  })

  describe('events', () => {
    beforeEach(async () => {
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: join(testsPath, 'orbitdb'),
      })
    })

    it('emits \'close\' when the database is closed', async () => {
      let closed = false
      const onClose = () => {
        closed = true
      }

      db.events.addEventListener('close', onClose)

      await db.close()

      strictEqual(closed, true)
    })

    it('emits \'drop\' when the database is dropped', async () => {
      let dropped = false
      const onDrop = () => {
        dropped = true
      }

      db.events.addEventListener('drop', onDrop)

      await db.drop()

      strictEqual(dropped, true)

      await db.close()
    })
  })
})
