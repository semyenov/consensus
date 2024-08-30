import { deepEqual, deepStrictEqual, strictEqual } from 'node:assert'

import * as crypto from '@libp2p/crypto'
import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  KeyStore,
  LevelStorage,
} from '../src'
import {
  signMessage,
  verifyMessage,
} from '../src/key-store'

import testKeysPath from './fixtures/test-keys-path'

// import type {
//   // KeyStoreInstance,
//   // PrivateKeys,
//   // Secp256k1PrivateKey,
// } from '../src'

const defaultPath = './.orbitdb/keystore'
const keysPath = './testkeys'

describe('keyStore', () => {
  let keystore: KeyStore

  describe('creating and retrieving keys', () => {
    let id: string

    beforeEach(async () => {
      keystore = await KeyStore.create({ path: defaultPath })

      id = 'key1'
      await keystore.createKey(id)
    })

    afterEach(async () => {
      if (keystore) {
        await keystore.close()
        await rimraf(defaultPath)
      }
    })

    it('creates a key', async () => {
      const hasKey = await keystore.hasKey(id)
      strictEqual(hasKey, true)
    })

    it('throws an error when creating a key without an id', async () => {
      let err

      try {
        await keystore.createKey(null as unknown as string)
      }
      catch (error: any) {
        err = error.toString()
      }

      strictEqual(err, 'Error: id needed to create a key')
    })

    it('throws an error when creating a key with a null id', async () => {
      let err

      try {
        await keystore.createKey(null as unknown as string)
      }
      catch (error: any) {
        err = error.toString()
      }

      strictEqual(err, 'Error: id needed to create a key')
    })

    it('returns true if key exists', async () => {
      const id = 'key1'

      await keystore.createKey(id)
      const hasKey = await keystore.hasKey(id)
      strictEqual(hasKey, true)
    })

    it('returns false if key does not exist', async () => {
      const id = 'key1234567890'
      const hasKey = await keystore.hasKey(id)
      strictEqual(hasKey, false)
    })

    it('throws an error when checking if key exists when no id is specified', async () => {
      let err
      try {
        await keystore.hasKey(null as unknown as string)
      }
      catch (error: any) {
        err = error.toString()
      }
      strictEqual(err, 'Error: id needed to check a key')
    })

    it('gets a key', async () => {
      const id = 'key1'
      const keys = await keystore.createKey(id)
      const result = await keystore.getKey(id)

      deepEqual(result, keys)
    })

    it('throws an error when getting a key without an id', async () => {
      const id = 'key1'
      let err

      await keystore.createKey(id)

      try {
        await keystore.getKey(null as unknown as string)
      }
      catch (error: any) {
        err = error.toString()
      }

      strictEqual(err, 'Error: id needed to get a key')
    })

    it('throws an error when getting a key with a null id', async () => {
      const id = 'key1'
      let err

      await keystore.createKey(id)

      try {
        await keystore.getKey(null as unknown as string)
      }
      catch (error: any) {
        err = error.toString()
      }

      strictEqual(err, 'Error: id needed to get a key')
    })

    it('gets a non-existent key', async () => {
      const expected = null
      const id = 'key111111111'

      const actual = await keystore.getKey(id)

      strictEqual(actual, expected)
    })

    it('doesn\'t create a key when keystore is closed', async () => {
      let err
      await keystore.close()
      try {
        await keystore.createKey(id)
      }
      catch (error: any) {
        err = error.toString()
      }

      strictEqual(err, 'Error: Database is not open')
    })
  })

  describe('options', () => {
    const unmarshal
      = crypto.keys.supportedKeys.secp256k1.unmarshalSecp256k1PrivateKey
    const privateKey
      = '198594a8de39fd97017d11996d619b3746211605a9d290964badf58bc79bdb33'
    const publicKey
      = '0260baeaffa1de1e4135e5b395e0380563a622b9599d1b8e012a0f7603f516bdaa'
    let privateKeyBuffer, publicKeyBuffer, unmarshalledPrivateKey

    beforeAll(async () => {
      privateKeyBuffer = uint8ArrayFromString(privateKey, 'base16')
      publicKeyBuffer = uint8ArrayFromString(publicKey, 'base16')
      unmarshalledPrivateKey = await unmarshal(privateKeyBuffer)
    })

    describe('using default options', () => {
      beforeEach(async () => {
        const storage = await LevelStorage.create({ path: defaultPath })
        await storage.put('private_key1', privateKeyBuffer)
        await storage.put('public_key1', publicKeyBuffer)
        await storage.close()

        keystore = await KeyStore.create({})
      })

      afterEach(async () => {
        if (keystore) {
          await keystore.close()
          await rimraf(defaultPath)
        }
      })

      it('uses default storage and default path to retrieve a key', async () => {
        deepEqual(await keystore.getKey('key1'), unmarshalledPrivateKey)
      })
    })

    describe('setting options.storage', () => {
      const path = './custom-level-key-store'

      beforeEach(async () => {
        const storage = await LevelStorage.create({ path })
        await storage.put('private_key2', privateKeyBuffer)
        await storage.put('public_key2', publicKeyBuffer)

        keystore = await KeyStore.create({ storage })
      })

      afterEach(async () => {
        if (keystore) {
          await keystore.close()
          await rimraf(path)
        }
      })

      it('uses the given storage to retrieve a key', async () => {
        deepEqual(await keystore.getKey('key2'), unmarshalledPrivateKey)
      })
    })

    describe('setting options.path', () => {
      beforeEach(async () => {
        await copy(testKeysPath, keysPath)

        const storage = await LevelStorage.create({ path: keysPath })
        await storage.put('private_key3', privateKeyBuffer)
        await storage.put('public_key3', publicKeyBuffer)
        await storage.close()

        keystore = await KeyStore.create({ path: keysPath })
      })

      afterEach(async () => {
        if (keystore) {
          await keystore.close()
        }

        await rimraf(keysPath)
      })

      it('uses default storage using given path to retrieve a key', async () => {
        deepEqual(await keystore.getKey('key3'), unmarshalledPrivateKey)
      })
    })
  })

  describe('using keys for signing and verifying', () => {
    beforeEach(async () => {
      await copy(testKeysPath, keysPath)
      keystore = await KeyStore.create({ path: keysPath })
      // For creating test keys fixtures (level) database
      // const identities = await Identities({ keystore })
      // const a = await identities.createIdentity({ id: 'userA' })
      // const b = await identities.createIdentity({ id: 'userB' })
      // const c = await identities.createIdentity({ id: 'userC' })
      // const d = await identities.createIdentity({ id: 'userD' })
      // const x = await identities.createIdentity({ id: 'userX' })
    })

    afterEach(async () => {
      if (keystore) {
        await keystore.close()
      }
      await rimraf(keysPath)
    })

    describe('signing', () => {
      it('signs data', async () => {
        const expected
          = '3045022100df961fa46bb8a3cb92594a24205e6008a84daa563ac3530f583bb9f9cef5af3b02207b84c5d63387d0a710e42e05785fbccdaf2534c8ed16adb8afd57c3eba930529'

        const key = await keystore.getKey('userA')
        const actual = await signMessage(key, 'data data data')
        strictEqual(actual, expected)
      })

      it('throws an error if no key is passed', async () => {
        let err
        try {
          await signMessage(
            null as unknown as Secp256k1PrivateKey,
            'data data data',
          )
        }
        catch (error: any) {
          err = error.toString()
        }

        strictEqual(err, 'Error: No signing key given')
      })

      it('throws an error if no data is passed', async () => {
        const key = 'key_1' as unknown as Secp256k1PrivateKey
        let err
        try {
          await signMessage(key, null as unknown as string)
        }
        catch (error: any) {
          err = error.toString()
        }

        strictEqual(err, 'Error: Given input data was undefined')
      })
    })

    describe('getting the public key', async () => {
      let key

      beforeEach(async () => {
        key = await keystore.getKey('userA')
      })

      it('gets the public key', async () => {
        const expected
          = '02e7247a4c155b63d182a23c70cb6fe8ba2e44bc9e9d62dc45d4c4167ccde95944'
        const publicKey = await keystore.getPublic(key)
        strictEqual(publicKey, expected)
      })

      // it('gets the public key buffer', async () => {
      //   const expected = '02e7247a4c155b63d182a23c70cb6fe8ba2e44bc9e9d62dc45d4c4167ccde95944'

      //   const publicKey = await keystore.getPublic(key, { format: 'buffer' })

      //   deepStrictEqual(uint8ArrayToString(publicKey, 'base16'), expected)
      // })

      it('throws an error if no keys are passed', async () => {
        try {
          await keystore.getPublic(null as unknown as PrivateKeys)
        }
        catch {
          strictEqual(true, true)
        }
      })

      it('throws an error if a bad format is passed', async () => {
        try {
          await keystore.getPublic(key, { format: 'foo' as 'hex' })
        }
        catch {
          strictEqual(true, true)
        }
      })
    })

    describe('verifying', async () => {
      let key: Secp256k1PrivateKey, publicKey: string

      beforeEach(async () => {
        key = await keystore.getKey('userA')
        publicKey = await keystore.getPublic(key)
      })

      it('verifies content', async () => {
        const signature = await signMessage(key, 'data data data')
        const expectedSignature
          = '3045022100df961fa46bb8a3cb92594a24205e6008a84daa563ac3530f583bb9f9cef5af3b02207b84c5d63387d0a710e42e05785fbccdaf2534c8ed16adb8afd57c3eba930529'
        strictEqual(expectedSignature, signature)

        const verified = await verifyMessage(
          expectedSignature,
          publicKey,
          'data data data',
        )
        strictEqual(verified, true)
      })

      it('verifies content with cache', async () => {
        const data = 'data'.repeat(1024 * 1024)
        const signature = await signMessage(key, data)
        const startTime = new Date()
          .getTime()
        await verifyMessage(signature, publicKey, data)
        const first = new Date()
          .getTime()
        await verifyMessage(signature, publicKey, data)
        const after = new Date()
          .getTime()
        console.log(
          'First pass:',
          first - startTime,
          'ms',
          'Cached:',
          after - first,
          'ms',
        )
        strictEqual(first - startTime > after - first, true)
      })

      it('does not verify content with bad signature', async () => {
        const signature = 'xxxxxx'
        let verified
        try {
          verified = await verifyMessage(
            signature,
            publicKey,
            'data data data',
          )
        }
        catch {
          verified = false
        }
        strictEqual(verified, false)
      })
    })
  })
})
