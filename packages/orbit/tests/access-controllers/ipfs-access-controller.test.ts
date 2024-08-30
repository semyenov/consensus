// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
import { deepStrictEqual, notStrictEqual, strictEqual } from 'node:assert'

import { rimraf } from 'rimraf'
import { afterAll, beforeAll, describe, it } from 'vitest'

import {
  IPFSAccessController,
  Identities,
  KeyStore,
} from '../../src'
import connectPeers from '../utils/connect-nodes'
import createHelia from '../utils/create-helia'

// import type {
//   IPFS,
//   IdentitiesInstance,
//   IdentityInstance,
//   KeyStoreInstance,
//   OrbitDBInstance,
// } from '@orbitdb/core'

describe('iPFSAccessController', () => {
  const dbPath1 = './orbitdb/tests/ipfs-access-controller/1'
  const dbPath2 = './orbitdb/tests/ipfs-access-controller/2'

  let ipfs1: IPFS, ipfs2: IPFS
  let keystore1: KeyStoreInstance, keystore2: KeyStoreInstance
  let identities1: IdentitiesInstance, identities2: IdentitiesInstance
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let orbitdb1: OrbitDBInstance, orbitdb2: OrbitDBInstance

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([createHelia(), createHelia()])
    await connectPeers(ipfs1, ipfs2)

    keystore1 = await KeyStore.create({ path: `${dbPath1}/keys` })
    keystore2 = await KeyStore.create({ path: `${dbPath2}/keys` })

    identities1 = await Identities.create({ keystore: keystore1, ipfs: ipfs1 })
    identities2 = await Identities.create({ keystore: keystore2, ipfs: ipfs2 })

    testIdentity1 = await identities1.createIdentity({ id: 'userA' })
    testIdentity2 = await identities2.createIdentity({ id: 'userB' })

    orbitdb1 = { ipfs: ipfs1, identity: testIdentity1 } as OrbitDBInstance
    orbitdb2 = { ipfs: ipfs2, identity: testIdentity2 } as OrbitDBInstance
  })

  afterAll(async () => {
    if (ipfs1) {
      await ipfs1.stop()
    }

    if (ipfs2) {
      await ipfs2.stop()
    }

    if (keystore1) {
      await keystore1.close()
    }

    if (keystore2) {
      await keystore2.close()
    }

    await rimraf('./orbitdb')
    await rimraf('./ipfs1')
    await rimraf('./ipfs2')
  })

  let accessController: IPFSAccessController

  describe('default write access', () => {
    beforeAll(async () => {
      accessController = await IPFSAccessController.create({
        orbitdb: orbitdb1,
        identities: identities1,
      })
    })

    it('creates an access controller', () => {
      notStrictEqual(accessController, null)
      notStrictEqual(accessController, undefined)
    })

    it('sets the controller type', () => {
      strictEqual(accessController.type, 'ipfs')
    })

    it('sets default write', async () => {
      deepStrictEqual(accessController.write, [testIdentity1.id])
    })

    it('user with write access can append', async () => {
      const mockEntry = {
        identity: testIdentity1.hash,
        v: 1,
        // ...
        // doesn't matter what we put here, only identity is used for the check
      }
      const canAppend = await accessController.canAppend(mockEntry)
      strictEqual(canAppend, true)
    })

    it('user without write cannot append', async () => {
      const mockEntry = {
        identity: testIdentity2.hash,
        v: 1,
        // ...
        // doesn't matter what we put here, only identity is used for the check
      }
      const canAppend = await accessController.canAppend(mockEntry)
      strictEqual(canAppend, false)
    })

    it('replicates the access controller', async () => {
      const replicatedAccessController = await IPFSAccessController.create({
        orbitdb: orbitdb2,
        identities: identities2,
        address: accessController.address,
      })

      strictEqual(replicatedAccessController.type, accessController.type)
      strictEqual(replicatedAccessController.address, accessController.address)
      deepStrictEqual(replicatedAccessController.write, accessController.write)
    })
  })

  describe('write all access', () => {
    beforeAll(async () => {
      accessController = await IPFSAccessController.create({
        orbitdb: orbitdb1,
        identities: identities1,
        write: ['*'],
      })
    })

    it('sets write to \'Anyone\'', async () => {
      deepStrictEqual(accessController.write, ['*'])
    })
  })
})
