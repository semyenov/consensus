import { deepStrictEqual, notStrictEqual, strictEqual } from 'node:assert'
import { basename, dirname, join } from 'node:path'

import { rimraf } from 'rimraf'
import { afterAll, beforeAll, describe, it } from 'vitest'

import { OrbitDB, OrbitDBAccessController, type OrbitDBInstance } from '../../src'
import { Identities, type IdentitiesInstance, type IdentityInstance } from '../../src/identities'
import { KeyStore, type KeyStoreInstance } from '../../src/key-store'
import connectPeers from '../utils/connect-nodes'
import createHelia from '../utils/create-helia'

import type { OrbitDBAccessControllerInstance } from '../../src/access-controllers'
import type { EntryInstance } from '../../src/oplog'
import type { HeliaInstance } from '../../src/vendor'

const testsPath = join(
  dirname(__filename),
  '.orbitdb/tests',
  basename(__filename, '.test.ts'),
)

describe('orbitDBAccessController', () => {
  let
    ipfs1: HeliaInstance, ipfs2: HeliaInstance,
    orbitdb1: OrbitDBInstance, orbitdb2: OrbitDBInstance,
    identities1: IdentitiesInstance, identities2: IdentitiesInstance,
    testIdentity1: IdentityInstance, testIdentity2: IdentityInstance

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([createHelia(), createHelia()])
    await connectPeers(ipfs1, ipfs2)

    const keystore1 = await KeyStore.create({ path: `${testsPath}/1/keys` })
    const keystore2 = await KeyStore.create({ path: `${testsPath}/2/keys` })

    identities1 = await Identities.create({ ipfs: ipfs1, keystore: keystore1 })
    identities2 = await Identities.create({ ipfs: ipfs2, keystore: keystore2 })

    testIdentity1 = await identities1.createIdentity({ id: 'userA' })
    testIdentity2 = await identities2.createIdentity({ id: 'userB' })

    orbitdb1 = await OrbitDB.create({
      ipfs: ipfs1,
      identities: identities1,
      id: 'userA',
      directory: `${testsPath}/1/orbitdb`,
    })
    orbitdb2 = await OrbitDB.create({
      ipfs: ipfs2,
      identities: identities2,
      id: 'userB',
      directory: `${testsPath}/2/orbitdb`,
    })
  })

  afterAll(async () => {
    if (orbitdb1) {
      await orbitdb1.stop()
    }

    if (orbitdb2) {
      await orbitdb2.stop()
    }

    if (ipfs1) {
      await ipfs1.stop()
    }

    if (ipfs2) {
      await ipfs2.stop()
    }

    await rimraf(testsPath)
  })

  describe('default write access', () => {
    let accessController: OrbitDBAccessControllerInstance

    beforeAll(async () => {
      accessController = await OrbitDBAccessController.create({
        orbitdb: orbitdb1,
        identities: identities1,
      })
    })

    it('creates an access controller', () => {
      notStrictEqual(accessController, null)
      notStrictEqual(accessController, undefined)
    })

    it('sets the controller type', () => {
      strictEqual(accessController.type, 'orbitdb')
    })

    it('sets default capabilities', async () => {
      const expected: Record<string, Set<string>> = {}
      expected.admin = new Set([testIdentity1.id])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('allows owner to append after creation', async () => {
      const mockEntry = {
        identity: testIdentity1.hash,
        // ...
        // doesn't matter what we put here, only identity is used for the check
      }
      const canAppend = await accessController.canAppend(mockEntry as EntryInstance)
      strictEqual(canAppend, true)
    })
  })

  describe('grant', () => {
    let accessController: OrbitDBAccessControllerInstance

    beforeAll(async () => {
      accessController = await OrbitDBAccessController.create({
        orbitdb: orbitdb1,
        identities: identities1,
        address: 'testdb/add',
      })
    })

    it('adds a capability', async () => {
      try {
        await accessController.grant('write', testIdentity1.id)
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, Set<string>> = {}
      expected.admin = new Set([testIdentity1.id])
      expected.write = new Set([testIdentity1.id])
      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('adds more capabilities', async () => {
      try {
        await accessController.grant('read', 'ABCD')
        await accessController.grant('delete', 'ABCD')
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, any> = {}
      expected.admin = new Set([testIdentity1.id])
      expected.write = new Set([testIdentity1.id])
      expected.read = new Set(['ABCD'])
      expected.delete = new Set(['ABCD'])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('emit \'update\' event when a capability was added', async () => {
      let update = false

      accessController.events.addEventListener('update', (_entry) => {
        update = true
      })

      await accessController.grant('read', 'AXES')

      strictEqual(update, true)
    })

    it('can append after acquiring capability', async () => {
      try {
        await accessController.grant('write', testIdentity1.id)
        await accessController.grant('write', testIdentity2.id)
      }
      catch (error) {
        strictEqual(error, null)
      }

      const mockEntry1 = {
        identity: testIdentity1.hash,
      } as EntryInstance

      const mockEntry2 = {
        identity: testIdentity2.hash,
      } as EntryInstance

      const canAppend1 = await accessController.canAppend(mockEntry1)

      const accessController2 = await OrbitDBAccessController.create({
        orbitdb: orbitdb2,
        identities: identities2,
        address: 'testdb/add',
      })
      const canAppend2 = await accessController2.canAppend(mockEntry2)

      strictEqual(canAppend1, true)
      strictEqual(canAppend2, true)
    })
  })

  describe('revoke', () => {
    let accessController: OrbitDBAccessControllerInstance

    beforeAll(async () => {
      accessController = await OrbitDBAccessController.create({
        orbitdb: orbitdb1,
        identities: identities1,
        address: 'testdb/remove',
      })
    })

    it('removes a capability', async () => {
      try {
        await accessController.grant('write', testIdentity1.id)
        await accessController.grant('write', 'AABB')
        await accessController.revoke('write', 'AABB')
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, any> = {}
      expected.admin = new Set([testIdentity1.id])
      expected.write = new Set([testIdentity1.id])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('can remove the creator\'s write access', async () => {
      try {
        await accessController.revoke('write', testIdentity1.id)
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, any> = {}
      expected.admin = new Set([testIdentity1.id])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('can\'t remove the creator\'s admin access', async () => {
      try {
        await accessController.revoke('admin', testIdentity1.id)
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, any> = {}
      expected.admin = new Set([testIdentity1.id])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('removes more capabilities', async () => {
      try {
        await accessController.grant('read', 'ABCD')
        await accessController.grant('delete', 'ABCD')
        await accessController.grant('write', testIdentity1.id)
        await accessController.revoke('read', 'ABCDE')
        await accessController.revoke('delete', 'ABCDE')
      }
      catch (error) {
        strictEqual(error, null)
      }

      const expected: Record<string, any> = {}
      expected.admin = new Set([testIdentity1.id])
      expected.write = new Set([testIdentity1.id])
      expected.read = new Set(['ABCD'])
      expected.delete = new Set(['ABCD'])

      deepStrictEqual(await accessController.capabilities(), expected)
    })

    it('can\'t append after revoking capability', async () => {
      try {
        await accessController.grant('write', testIdentity2.id)
        await accessController.revoke('write', testIdentity2.id)
      }
      catch (error) {
        strictEqual(error, null)
      }
      const mockEntry1 = {
        identity: testIdentity1.hash,
      }
      const mockEntry2 = {
        identity: testIdentity2.hash,
      }
      const canAppend = await accessController.canAppend(mockEntry1 as EntryInstance)
      const noAppend = await accessController.canAppend(mockEntry2 as EntryInstance)
      strictEqual(canAppend, true)
      strictEqual(noAppend, false)
    })

    it('emits \'update\' event when a capability was removed', async () => {
      await accessController.grant('admin', 'cats')
      await accessController.grant('admin', 'dogs')

      let update = false

      accessController.events.addEventListener('update', (_entry) => {
        update = true
      })

      await accessController.revoke('admin', 'cats')

      strictEqual(update, true)
    })
  })
})
// TODO: use two separate peers for testing the AC
// TODO: add tests for revocation correctness with a database (integration tests)
