import { deepEqual, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest'

import {
  Database,
  Entry,
  Identities,
  KeyStore,
  LevelStorage,
  MemoryStorage,
} from '../src'

import testKeysPath from './fixtures/test-keys-path'
import createHelia from './utils/create-helia'

import type { AccessControllerInstance } from '../src/access-controllers'
import type { IdentitiesInstance, IdentityInstance } from '../src/identities'
import type { KeyStoreInstance } from '../src/key-store'
import type { EntryInstance } from '../src/oplog'
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
  let db: Database

  const databaseId = 'database-AAA'

  const accessController: AccessControllerInstance = {
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
    await rimraf(join(testsPath, 'orbitdb'))
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

    deepEqual(actual, expected)

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
      // console.log('Database', db)
      const headsPath = join(
        testsPath,
        'orbitdb',
        databaseId,
        'log/_heads',
      )

      strictEqual(existsSync(headsPath), true)
      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepEqual(
        (await Entry.decode((await headsStorage.get(hash)) as Uint8Array))
          .payload,
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
        directory: join(testsPath, 'orbitdb'),
      })
      const op = { op: 'PUT' as const, key: '1', value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      const headsPath = join(
        testsPath,
        'orbitdb',
        databaseId,
        'log/_heads',
      )

      strictEqual(existsSync(headsPath), true)

      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepEqual(
        (await Entry.decode((await headsStorage.get(hash)) as Uint8Array))
          .payload,
        op,
      )

      await headsStorage.close()

      await rimraf(headsPath)
      await rimraf(join(testsPath, 'orbitdb'))
    })

    it('uses given MemoryStorage for headsStorage', async () => {
      const headsStorage = new MemoryStorage<Uint8Array>()
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

      deepEqual(
        (await Entry.decode((await headsStorage.get(hash)) as Uint8Array))
          .payload,
        op,
      )

      await db.close()
    })

    it('uses given MemoryStorage for entryStorage', async () => {
      const entryStorage = new MemoryStorage<Uint8Array>()
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

      deepEqual(
        (await Entry.decode((await entryStorage.get(hash)) as Uint8Array))
          .payload,
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
