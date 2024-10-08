/* eslint-disable no-console */
import { deepStrictEqual, strictEqual } from 'node:assert'
import { basename, dirname, join } from 'node:path'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Documents,
  Identities,
  KeyStore,
} from '../../../src'
import testKeysPath from '../../fixtures/test-keys-path'
import connectPeers from '../../utils/connect-nodes'
import createHelia from '../../utils/create-helia'
import waitFor from '../../utils/wait-for'

import type { AccessControllerInstance } from '../../../src/access-controllers'
import type { DocumentsDoc, DocumentsInstance } from '../../../src/databases/documents'
import type { IdentitiesInstance } from '../../../src/identities'
import type { IdentityInstance } from '../../../src/identities/identity'
import type { KeyStoreInstance } from '../../../src/key-store'
import type { HeliaInstance } from '../../../src/vendor'

const testsPath = join(
  dirname(__filename),
  '.orbitdb/tests',
  basename(__filename, '.test.ts'),
)

describe('documents Database Replication', () => {
  let ipfs1: HeliaInstance, ipfs2: HeliaInstance
  let keystore: KeyStoreInstance
  let identities: IdentitiesInstance, identities2: IdentitiesInstance
  let testIdentity1: IdentityInstance, testIdentity2: IdentityInstance
  let db1: DocumentsInstance, db2: DocumentsInstance

  const databaseId = 'documents-AAA'

  const accessController: AccessControllerInstance = {
    type: 'basic',
    write: ['*'],
    canAppend: async (entry) => {
      const identity1 = await identities.getIdentity(entry.identity!)
      const identity2 = await identities.getIdentity(entry.identity!)

      if (!identity1 || !identity2) {
        throw new Error('Identity not found')
      }

      return identity1.id === testIdentity1.id
        || identity2.id === testIdentity2.id
    },
  }

  beforeAll(async () => {
    [ipfs1, ipfs2] = await Promise.all([
      createHelia({ directory: join(testsPath, '1', 'ipfs') }),
      createHelia({ directory: join(testsPath, '2', 'ipfs') }),
    ])
    await connectPeers(ipfs1, ipfs2)

    await copy(testKeysPath, join(testsPath, 'keystore'))
    keystore = await KeyStore.create({ path: join(testsPath, 'keystore') })
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
      directory: join(testsPath, '1', 'orbitdb'),
    })
    db2 = await Documents.create({
      ipfs: ipfs2,
      identity: testIdentity2,
      address: databaseId,
      name: 'testdb2',
      accessController,
      directory: join(testsPath, '2', 'orbitdb'),
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

    await rimraf(testsPath)
  })

  it('basic Verification', async () => {
    const msg = new Uint8Array([1, 2, 3, 4, 5])
    const sig = await testIdentity1.sign!(msg)
    const verified = await testIdentity2.verify!(sig, testIdentity1.publicKey, msg)
    strictEqual(verified, true)
  })

  it('replicates documents across two peers', async () => {
    let connected1 = false
    let connected2 = false

    db1.sync.events.addEventListener('join', (event) => {
      console.log('db1 joined', event.detail)
      connected1 = true
    })
    db2.sync.events.addEventListener('join', (event) => {
      console.log('db2 joined', event.detail)
      connected2 = true
    })

    db1.events.addEventListener('error', (err: any) => {
      console.error(err.detail)
    })

    db2.events.addEventListener('error', (err: any) => {
      console.error(err.detail)
    })

    await db1.put({ _id: 1, msg: 'record 1 on db 1' })
    await db1.put({ _id: 3, msg: 'record 3 on db 1' })
    await waitFor(() => connected1, () => true)

    await db2.put({ _id: 2, msg: 'record 2 on db 2' })
    await db2.put({ _id: 4, msg: 'record 4 on db 2' })
    await waitFor(() => connected2, () => true)

    const all1: DocumentsDoc[] = []
    for await (const item of db1.iterator()) {
      all1.unshift(item)
    }

    const all2: DocumentsDoc[] = []
    for await (const item of db2.iterator()) {
      all2.unshift(item)
    }

    deepStrictEqual(all1, all2)
  })
})
