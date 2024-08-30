import { deepStrictEqual, strictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { toString as uint8ArrayToString } from 'uint8arrays'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Documents,
  Identities,
  KeyStore,
} from '../../../src'
import testKeysPath from '../../fixtures/test-keys-path.js'
import connectPeers from '../../utils/connect-nodes.js'
import createHelia from '../../utils/create-helia.js'
import waitFor from '../../utils/wait-for.js'

import type {
  Database,
} from '../../../src'
import type { Identity } from '../../../src/identities/identity'
import type { HeliaInstance } from '../../../src/vendor'

// import type {
//   DocumentsDoc,
//   DocumentsInstance,
//   IPFS,
//   IdentitiesInstance,
//   IdentityInstance,
//   KeyStoreInstance,
// } from '@orbitdb/core'

const keysPath = './testkeys'

describe('documents Database Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStore
  let identities: Identities
  let identities2: Identities
  let testIdentity1: Identity, testIdentity2: Identity
  let db1: DocumentsDatabase, db2: DocumentsDatabase

  const databaseId = 'documents-AAA'

  const accessController = {
    canAppend: async (entry) => {
      const identity1 = await identities.getIdentity(entry.identity)
      const identity2 = await identities.getIdentity(entry.identity)

      return identity1.id === testIdentity1.id
        || identity2.id === testIdentity2.id
    },
  }

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

  beforeEach(async () => {
    db1 = await Documents.create({
      ipfs: ipfs1,
      identity: testIdentity1,
      address: databaseId,
      accessController,
      name: 'testdb1',
      directory: './orbitdb1',
    })
    db2 = await Documents.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      name: 'testdb2',
      accessController,
      directory: './orbitdb2',
    })
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
    await rimraf('./orbitdb1')
    await rimraf('./orbitdb2')
    await rimraf('./ipfs1')
    await rimraf('./ipfs2')
  })

  it('basic Verification', async () => {
    const msg = new Uint8Array([1, 2, 3, 4, 5])
    const sig = await testIdentity1.sign(msg)
    const verified = await testIdentity2.verify(sig, testIdentity1.publicKey, msg)
    strictEqual(verified, true)
  })

  it('replicates documents across two peers', async () => {
    let connected1 = false
    let connected2 = false

    db1.sync.events.addEventListener('join', async (_peerId, _heads) => {
      console.log('db1 joined')
      connected1 = true
    })
    db2.sync.events.addEventListener('join', async (_peerId, _heads) => {
      console.log('db1 joined')
      connected2 = true
    })

    await db1.put({ _id: 1, msg: 'record 1 on db 1' })
    await db2.put({ _id: 2, msg: 'record 2 on db 2' })
    await db1.put({ _id: 3, msg: 'record 3 on db 1' })
    await db2.put({ _id: 4, msg: 'record 4 on db 2' })

    await waitFor(() => {
      return connected1
    }, () => {
      return true
    })
    await waitFor(() => {
      return connected2
    }, () => {
      return true
    })

    const all1: DocumentsDoc[] = []
    for await (const item of db1.iterator()) {
      all1.unshift(item)
    }

    const all2: DocumentsDoc[] = []
    for await (const item of db2.iterator()) {
      all2.unshift(item)
    }
    console.log('all1:', all1)
    console.log('all2:', all2)
    deepStrictEqual(all1, all2)
  })
})
