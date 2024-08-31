import { deepStrictEqual, strictEqual } from 'node:assert'
import { existsSync, readdirSync } from 'node:fs'
import Path from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

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

import type { IdentityInstance } from '../src/identities/identity'
import type { HeliaInstance } from '../src/vendor'

const keysPath = './testkeys'

describe('database', () => {
  // this.timeout(30000)

  let ipfs: HeliaInstance
  let keystore: KeyStore
  let identities: Identities
  let testIdentity: IdentityInstance
  let db: Database

  const databaseId = 'database-AAA'

  const accessController = {
    canAppend: async (entry) => {
      const identity1 = await identities.getIdentity(entry.identity)

      return identity1.id === testIdentity.id
    },
  }

  beforeAll(async () => {
    ipfs = await createHelia() as unknown as HeliaInstance
    await copy(testKeysPath, keysPath)
    keystore = await KeyStore.create({ path: keysPath })
    identities = await Identities.create({ keystore, ipfs })
    testIdentity = await identities.createIdentity({ id: 'userA' })
  })

  afterEach(async () => {
    await rimraf('./.orbitdb')
  })

  afterAll(async () => {
    if (ipfs) {
      await ipfs.stop()
    }

    if (keystore) {
      await keystore.close()
    }

    await rimraf(keysPath)
    await rimraf('./ipfs1')
  })

  it('adds an operation', async () => {
    db = await Database.create({
      ipfs,
      identity: testIdentity,
      address: databaseId,
      accessController,
      directory: './.orbitdb',
    })
    const expected = 'zdpuAwhx6xVpnMPUA7Q4JrvZsyoti5wZ18iDeFwBjPAwsRNof'
    const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
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
      })
      const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      const headsPath = Path.join(
        './.orbitdb/databases/',
        `${databaseId}/`,
        '/log/_heads/',
      )

      console.log('headsPath', headsPath)
      console.log('process.cwd', readdirSync('./.orbitdb'))

      strictEqual(await existsSync(headsPath), true)

      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash))).payload,
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
        directory: './custom-directory',
      })
      const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      const headsPath = Path.join(
        './custom-directory/',
        `${databaseId}/`,
        '/log/_heads/',
      )

      strictEqual(await existsSync(headsPath), true)

      await db.close()

      const headsStorage = await LevelStorage.create({ path: headsPath })

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash))).payload,
        op,
      )

      await headsStorage.close()

      await rimraf(headsPath)
      await rimraf('./custom-directory')
    })

    it('uses given MemoryStorage for headsStorage', async () => {
      const headsStorage = await MemoryStorage.create()
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: './.orbitdb',
        headsStorage,
      })
      const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      deepStrictEqual(
        (await Entry.decode(await headsStorage.get(hash))).payload,
        op,
      )

      await db.close()
    })

    it('uses given MemoryStorage for entryStorage', async () => {
      const entryStorage = await MemoryStorage.create()
      db = await Database.create({
        ipfs,
        identity: testIdentity,
        address: databaseId,
        accessController,
        directory: './.orbitdb',
        entryStorage,
      })
      const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
      const hash = await db.addOperation(op)

      deepStrictEqual(
        (await Entry.decode(await entryStorage.get(hash))).payload,
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
        directory: './.orbitdb',
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
