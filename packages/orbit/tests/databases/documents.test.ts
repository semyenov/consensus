/* eslint-disable no-console */
import { deepStrictEqual, notStrictEqual, strictEqual } from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Documents,
  Identities,
  KeyStore,
} from '../../src'
import testKeysPath from '../fixtures/test-keys-path'
import createHelia from '../utils/create-helia'

import type { AccessControllerInstance } from '../../src/access-controllers'
import type { DocumentsDoc, DocumentsInstance } from '../../src/databases/documents'
import type { IdentitiesInstance, IdentityInstance } from '../../src/identities'
import type { KeyStoreInstance } from '../../src/key-store'
import type { EntryInstance } from '../../src/oplog'
import type { HeliaInstance } from '../../src/vendor'

const keysPath = './.orbitdb/keystore'

describe('documents Database', () => {
  let ipfs: HeliaInstance
  let keystore: KeyStoreInstance
  let accessController: AccessControllerInstance
  let identities: IdentitiesInstance
  let testIdentity1: IdentityInstance
  let db: DocumentsInstance<any>

  const databaseId = 'documents-AAA'

  beforeAll(async () => {
    ipfs = await createHelia()

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
    identities = await Identities.create({ keystore, ipfs })
    testIdentity1 = await identities.createIdentity({ id: 'userA' })
  })

  afterAll(async () => {
    if (ipfs) {
      await ipfs.stop()
    }

    if (keystore) {
      await keystore.close()
    }

    await rimraf(keysPath)
    await rimraf('./.orbitdb')
    await rimraf('./ipfs1')
  })

  describe('default index _id:', () => {
    beforeEach(async () => {
      db = await Documents.create({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
        accessController,
      })
    })

    afterEach(async () => {
      if (db) {
        await db.drop()
        await db.close()
      }
    })

    it('creates a document store', async () => {
      strictEqual(db.address?.toString(), databaseId)
      strictEqual(db.type, 'documents')
      strictEqual(db.indexBy, '_id')
    })

    it('gets a document', async () => {
      const key = 'hello world 1'

      const expected = { _id: key, msg: 'writing 1 to db' }

      await db.put(expected)

      const doc = await db.get(key)
      deepStrictEqual(doc?.value, expected)
    })

    it('throws an error when putting a document with the wrong key', async () => {
      let err
      const key = 'hello world 1'

      const expected = { wrong_key: key, msg: 'writing 1 to db' }

      try {
        await db.put(expected)
      }
      catch (error: any) {
        err = error
      }
      strictEqual(
        err.message,
        'The provided document doesn\'t contain field \'_id\'',
      )
    })

    it('throws an error when getting a document with the wrong key', async () => {
      let err
      const key = 'hello world 1'

      const expected = { wrong_key: key, msg: 'writing 1 to db' }

      try {
        await db.put(expected)
      }
      catch (error: any) {
        err = error
      }
      strictEqual(
        err.message,
        'The provided document doesn\'t contain field \'_id\'',
      )
    })

    it('deletes a document', async () => {
      const key = 'hello world 1'

      await db.put({ _id: key, msg: 'writing 1 to db' })
      await db.del(key)

      const doc = await db.get(key)
      strictEqual(doc, null)
    })

    it('throws an error when deleting a non-existent document', async () => {
      const key = 'i do not exist'
      let err

      try {
        await db.del(key)
      }
      catch (error: any) {
        err = error
      }

      strictEqual(err.message, `No document with key '${key}' in the database`)
    })

    it('queries for a document', async () => {
      const expected = {
        _id: 'hello world 1',
        msg: 'writing new 1 to db',
        views: 10,
      }

      await db.put({ _id: 'hello world 1', msg: 'writing 1 to db', views: 10 })
      await db.put({ _id: 'hello world 2', msg: 'writing 2 to db', views: 5 })
      await db.put({ _id: 'hello world 3', msg: 'writing 3 to db', views: 12 })
      await db.del('hello world 3')
      await db.put(expected)

      const findFn = (doc: any) => doc.views > 5

      deepStrictEqual(await db.query(findFn), [expected])
    })

    it('queries for a non-existent document', async () => {
      await db.put({ _id: 'hello world 1', msg: 'writing 1 to db', views: 10 })
      await db.del('hello world 1')

      const findFn = (doc: any) => doc.views > 5

      deepStrictEqual(await db.query(findFn), [])
    })
  })

  describe('custom index doc', () => {
    beforeEach(async () => {
      db = await Documents.create({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
        accessController,
        indexBy: 'doc',
      })
    })

    afterEach(async () => {
      if (db) {
        await db.drop()
        await db.close()
      }
    })

    it('creates a document store', async () => {
      strictEqual(db.address?.toString(), databaseId)
      strictEqual(db.type, 'documents')
      strictEqual(db.indexBy, 'doc')
    })

    it('gets a document', async () => {
      const key = 'hello world 1'

      const expected = { doc: key, msg: 'writing 1 to db' }

      await db.put(expected)

      const doc = await db.get(key)
      deepStrictEqual(doc?.value, expected)
    })

    it('deletes a document', async () => {
      const key = 'hello world 1'

      await db.put({ doc: key, msg: 'writing 1 to db' })
      await db.del(key)

      const doc = await db.get(key)
      strictEqual(doc, null)
    })
    it('throws an error when putting a document with the wrong key', async () => {
      let err
      const key = 'hello world 1'

      const expected = { _id: key, msg: 'writing 1 to db' }

      try {
        await db.put(expected)
      }
      catch (error: any) {
        err = error
      }
      strictEqual(
        err.message,
        'The provided document doesn\'t contain field \'doc\'',
      )
    })

    it('throws an error when getting a document with the wrong key', async () => {
      let err
      const key = 'hello world 1'

      const expected = { _id: key, msg: 'writing 1 to db' }

      try {
        await db.put(expected)
      }
      catch (error: any) {
        err = error
      }
      strictEqual(
        err.message,
        'The provided document doesn\'t contain field \'doc\'',
      )
    })

    it('throws an error when deleting a non-existent document', async () => {
      const key = 'i do not exist'
      let err

      try {
        await db.del(key)
      }
      catch (error: any) {
        err = error
      }

      strictEqual(err.message, `No document with key '${key}' in the database`)
    })

    it('queries for a document', async () => {
      const expected = {
        doc: 'hello world 1',
        msg: 'writing new 1 to db',
        views: 10,
      }

      await db.put({ doc: 'hello world 1', msg: 'writing 1 to db', views: 10 })
      await db.put({ doc: 'hello world 2', msg: 'writing 2 to db', views: 5 })
      await db.put({ doc: 'hello world 3', msg: 'writing 3 to db', views: 12 })
      await db.del('hello world 3')
      await db.put(expected)

      const findFn = (doc: any) => doc.views > 5

      deepStrictEqual(await db.query(findFn), [expected])
    })

    it('queries for a non-existent document', async () => {
      await db.put({ doc: 'hello world 1', msg: 'writing 1 to db', views: 10 })
      await db.del('hello world 1')

      const findFn = (doc: any) => doc.views > 5

      deepStrictEqual(await db.query(findFn), [])
    })
  })

  describe('iterator', () => {
    beforeAll(async () => {
      db = await Documents.create({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
        accessController,
      })
    })

    afterAll(async () => {
      if (db) {
        await db.drop()
        await db.close()
      }
    })

    it('has an iterator function', async () => {
      notStrictEqual(db.iterator, undefined)
      strictEqual(typeof db.iterator, 'function')
    })

    it('returns no documents when the database is empty', async () => {
      const all: DocumentsDoc[] = []
      for await (const doc of db.iterator()) {
        all.unshift(doc)
      }
      strictEqual(all.length, 0)
    })

    it('returns all documents when the database is not empty', async () => {
      try {
        await db.put({ _id: 'doc1', something: true })
        await db.put({ _id: 'doc2', something: true })
        await db.put({ _id: 'doc3', something: true })
        await db.put({ _id: 'doc4', something: true })
        await db.put({ _id: 'doc5', something: true })

        // Add one more document and then delete it to count
        // for the fact that the amount returned should be
        // the amount of actual documents returned and not
        // the oplog length, and deleted documents don't
        // count towards the returned amount.
        await db.put({ _id: 'doc6', something: true })
        await db.del('doc6')
      }
      catch (error) {
        console.log('error', error)
      }
      const all: DocumentsDoc[] = []
      console.log('db', await db.all())
      for await (const doc of db.iterator()) {
        all.unshift(doc)
      }
      strictEqual(all.length, 5)
    })

    it('returns only the amount of documents given as a parameter', async () => {
      const amount = 3
      const all: DocumentsDoc[] = []
      for await (const doc of db.iterator({ amount })) {
        all.unshift(doc)
      }
      strictEqual(all.length, amount)
    })

    it('returns only two documents if amount given as a parameter is 2', async () => {
      const amount = 2
      const all: DocumentsDoc[] = []
      for await (const doc of db.iterator({ amount })) {
        all.unshift(doc)
      }
      strictEqual(all.length, amount)
    })

    it('returns only one document if amount given as a parameter is 1', async () => {
      const amount = 1
      const all: DocumentsDoc[] = []
      for await (const doc of db.iterator({ amount })) {
        all.unshift(doc)
      }
      strictEqual(all.length, amount)
    })
  })

  describe('supported data types', () => {
    const data = {
      booleans: { _id: 'booleans', value: true },
      integers: { _id: 'integers', value: 123 },
      floats: { _id: 'floats', value: 3.14 },
      arrays: { _id: 'arrays', value: [1, 2, 3] },
      maps: { _id: 'maps', value: new Map([['a', 1], ['b', 2]]) },
      uint8: { _id: 'uint8', value: new Uint8Array([1, 2, 3]) },
    }

    beforeEach(async () => {
      db = await Documents.create({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
        accessController,
      })
      for (const doc of Object.values(data)) {
        await db.put(doc)
      }
      await db.close()
      db = await Documents.create({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
        accessController,
      })
    })

    afterEach(async () => {
      if (db) {
        await db.drop()
        await db.close()
      }
    })

    it('supports booleans', async () => {
      const doc = await db.get('booleans')
      deepStrictEqual(doc?.value, data.booleans)
    })

    it('supports integers', async () => {
      const doc = await db.get('integers')
      deepStrictEqual(doc?.value, data.integers)
    })

    it('supports floats', async () => {
      const doc = await db.get('floats')
      deepStrictEqual(doc?.value, data.floats)
    })

    it('supports Arrays', async () => {
      const doc = await db.get('arrays')
      deepStrictEqual(doc?.value, data.arrays)
    })

    it('supports Maps', async () => {
      const doc = await db.get('maps')
      deepStrictEqual(doc?.value, {
        _id: 'maps',
        value: Object.fromEntries(data.maps.value),
      })
    })

    it('supports Uint8Arrays', async () => {
      const doc = await db.get('uint8')
      deepStrictEqual(doc?.value, data.uint8)
    })

    it('doesn\'t support Sets', async () => {
      const _id = 'test'
      const value = new Set([1, 2, 3, 4])

      let err

      try {
        await db.put({ _id, value })
      }
      catch (error: any) {
        err = error
      }

      notStrictEqual(err, undefined)
      strictEqual(err.message, 'CBOR encode error: unsupported type: Set')
    })
  })
})
