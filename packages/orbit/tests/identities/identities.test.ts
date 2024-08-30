import assert from 'node:assert'

import { copy } from 'fs-extra'
import { rimraf } from 'rimraf'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'

import {
  Identities,
  IdentityProviderRegistry,
  KeyStore,
  PublicKeyIdentityProvider,
} from '../../src'
import { Identity } from '../../src/identities'
import { signMessage, verifyMessage } from '../../src/key-store'
import CustomIdentityProvider from '../fixtures/providers/custom'
import FakeIdentityProvider from '../fixtures/providers/fake'
import NoTypeIdentityProvider from '../fixtures/providers/no-type'
import NoVerifyIdentityIdentityProvider from '../fixtures/providers/no-verify-identity'
import testKeysPath from '../fixtures/test-keys-path'
import createHelia from '../utils/create-helia'

const type = 'publickey'
const keysPath = './testkeys'

describe('identities', () => {
  let ipfs: any
  beforeAll(async () => {
    ipfs = await createHelia()
    await copy(testKeysPath, keysPath)
  })

  afterAll(async () => {
    await rimraf(keysPath)
  })

  describe('creating Identities', () => {
    const id = 'userA'

    let identities: Identities
    let identity: Identity

    afterEach(async () => {
      if (identities) {
        await identities.keystore.close()
      }
    })

    it('has the correct id', async () => {
      identities = await Identities.create({ path: keysPath, ipfs })
      identity = await identities.createIdentity({ id })
      const key = await identities.keystore.getKey(id)
      const externalId = uint8ArrayToString(key!.public.marshal(), 'base16')
      assert.strictEqual(identity.id, externalId)
    })
  })

  describe('get Identity', () => {
    const id = 'userA'

    let identities: Identities
    let identity: Identity

    afterEach(async () => {
      if (identities) {
        await identities.keystore.close()
      }
    })

    it('gets the identity from storage', async () => {
      identities = await Identities.create({ path: keysPath, ipfs })
      identity = await identities.createIdentity({ id })
      const result = await identities.getIdentity(identity.hash as string)
      assert.strictEqual(result?.id, identity.id)
      assert.strictEqual(result?.hash, identity.hash)
      assert.strictEqual(result?.publicKey, identity.publicKey)
      assert.strictEqual(result?.type, identity.type)
      assert.deepStrictEqual(result?.signatures, identity.signatures)
      assert.strictEqual(result?.sign, undefined)
      assert.strictEqual(result?.verify, undefined)
    })

    it('passes in an identity provider', async () => {
      const keystore = await KeyStore.create({ path: keysPath })
      identities = await Identities.create({ keystore, ipfs })
      const provider = new PublicKeyIdentityProvider({ keystore })
      identity = await identities.createIdentity({ id, provider })
      const result = await identities.getIdentity(identity.hash as string)
      assert.strictEqual(result?.id, identity.id)
      assert.strictEqual(result?.hash, identity.hash)
      assert.strictEqual(result.publicKey, identity.publicKey)
      assert.strictEqual(result.type, identity.type)
      assert.deepStrictEqual(result.signatures, identity.signatures)
      assert.strictEqual(result.sign, undefined)
      assert.strictEqual(result.verify, undefined)
    })
  })

  describe('passing in custom keystore', () => {
    const id = 'userB'

    let identities: Identities
    let identity: Identity
    let keystore: KeyStore

    beforeAll(async () => {
      keystore = await KeyStore.create({ path: keysPath })
      identities = await Identities.create({ keystore, ipfs })
    })

    afterAll(async () => {
      if (keystore) {
        await keystore.close()
      }
    })

    it('has the correct id', async () => {
      identity = await identities.createIdentity({ id })
      keystore = identities.keystore
      const key = await keystore.getKey(id)
      const externalId = uint8ArrayToString(key!.public.marshal(), 'base16')
      assert.strictEqual(identity.id, externalId)
    })

    it('created a key for id in identity-keystore', async () => {
      const key = await keystore.getKey(id)
      assert.notStrictEqual(key, undefined)
    })

    it('has the correct public key', async () => {
      const key = await keystore.getKey(id)
      const externalId = uint8ArrayToString(key!.public.marshal(), 'base16')
      const signingKey = await keystore.getKey(externalId)
      assert.notStrictEqual(signingKey, undefined)
      assert.strictEqual(identity.publicKey, keystore.getPublic(signingKey!))
    })

    it('has a signature for the id', async () => {
      const key = await keystore.getKey(id)
      const externalId = uint8ArrayToString(key!.public.marshal(), 'base16')
      const signingKey = await keystore.getKey(externalId)
      const idSignature = await signMessage(signingKey!, externalId)
      const publicKey = uint8ArrayToString(
        signingKey!.public.marshal(),
        'base16',
      )
      const verifies = await verifyMessage(idSignature, publicKey, externalId)
      assert.strictEqual(verifies, true)
      assert.strictEqual(identity.signatures.id, idSignature)
    })

    it('has a signature for the publicKey', async () => {
      const key = await keystore.getKey(id)
      const externalId = uint8ArrayToString(key!.public.marshal(), 'base16')
      const signingKey = await keystore.getKey(externalId)
      const idSignature = await signMessage(signingKey!, externalId)
      const externalKey = await keystore.getKey(id)
      const publicKeyAndIdSignature = await signMessage(
        externalKey!,
        identity.publicKey + idSignature,
      )
      assert.strictEqual(
        identity.signatures.publicKey,
        publicKeyAndIdSignature,
      )
    })
  })

  describe('create an identity with saved keys', () => {
    const id = 'userX'

    const expectedPublicKey
      = '0342fa42a69135eade1e37ea520bc8ee9e240efd62cb0edf0516b21258b4eae656'
    const expectedIdSignature
      = '3044022068b4bc360d127e39164fbc3b5184f5bd79cc5976286f793d9b38d1f2818e0259022027b875dc8c73635b32db72177b9922038ec4b1eabc8f1fd0919806b0b2519419'
    const expectedPkIdSignature
      = '30440220464cd4a6202dae2d2fb75b47afc7cceafa6b13c310efabbbdaaf38e67f74188b02201bbef8c97b741b4bb9e3e5362edfcd2eb6fe3b93f4e68e5870fcc345a850f366'

    let identities: Identities
    let identity: Identity
    let savedKeysKeyStore: KeyStore

    beforeAll(async () => {
      savedKeysKeyStore = await KeyStore.create({ path: keysPath })

      identities = await Identities.create({ keystore: savedKeysKeyStore, ipfs })
      identity = await identities.createIdentity({ id })
    })

    afterAll(async () => {
      if (savedKeysKeyStore) {
        await savedKeysKeyStore.close()
      }
    })

    it('has the correct id', async () => {
      const key = await savedKeysKeyStore.getKey(id)
      assert.strictEqual(
        identity.id,
        uint8ArrayToString(key?.public.marshal() || new Uint8Array([1]), 'base16'),
      )
    })

    it('has the correct public key', async () => {
      assert.strictEqual(identity.publicKey, expectedPublicKey)
    })

    it('has the correct identity type', async () => {
      assert.strictEqual(identity.type, type)
    })

    it('has the correct idSignature', async () => {
      assert.strictEqual(identity.signatures.id, expectedIdSignature)
    })

    it('has a publicKeyAndIdSignature for the publicKey', async () => {
      assert.strictEqual(identity.signatures.publicKey, expectedPkIdSignature)
    })

    it('has the correct signatures', async () => {
      const internalSigningKey = await savedKeysKeyStore.getKey(identity.id)
      const externalSigningKey = await savedKeysKeyStore.getKey(id)
      const idSignature = await signMessage(internalSigningKey, identity.id)
      const publicKeyAndIdSignature = await signMessage(
        externalSigningKey,
        identity.publicKey + idSignature,
      )
      const expectedSignature = {
        id: idSignature,
        publicKey: publicKeyAndIdSignature,
      }
      assert.deepStrictEqual(identity.signatures, expectedSignature)
    })
  })

  describe('verify identity\'s signature', () => {
    const id = 'QmFoo'

    let identities: Identities
    let identity: Identity
    let keystore: KeyStore

    beforeAll(async () => {
      keystore = await KeyStore.create({ path: keysPath })
    })

    afterAll(async () => {
      if (keystore) {
        await keystore.close()
      }
    })

    it('identity pkSignature verifies', async () => {
      identities = await Identities.create({ keystore, ipfs })
      identity = await identities.createIdentity({ id })
      const verified = await verifyMessage(
        identity.signatures.id,
        identity.publicKey,
        identity.id,
      )
      assert.strictEqual(verified, true)
    })

    it('identity signature verifies', async () => {
      identities = await Identities.create({ keystore, ipfs })
      identity = await identities.createIdentity({ id })
      const verified = await verifyMessage(
        identity.signatures.publicKey,
        identity.id,
        identity.publicKey + identity.signatures.id,
      )
      assert.strictEqual(verified, true)
    })

    it('false signature doesn\'t verify', async () => {
      const provider = new FakeIdentityProvider()
      IdentityProviderRegistry.useIdentityProvider(provider)
      identity = await identities.createIdentity(
        { provider },
      )
      const verified = await identities.verifyIdentity(identity)
      assert.strictEqual(verified, false)
    })
  })

  describe('verify identity', () => {
    const id = 'QmFoo'

    let identities: Identities
    let identity: Identity
    let keystore: KeyStore

    beforeAll(async () => {
      keystore = await KeyStore.create({ path: keysPath })
      identities = await Identities.create({ keystore, ipfs })
    })

    afterAll(async () => {
      if (keystore) {
        await keystore.close()
      }
    })

    it('identity verifies', async () => {
      identity = await identities.createIdentity({ id })
      console.log('IDENTITY', identity)
      const verified = await identities.verifyIdentity(identity)
      assert.strictEqual(verified, true)
    })
  })

  describe('sign data with an identity', () => {
    const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
    const data = 'hello friend'

    let identities: Identities
    let identity: Identity
    let keystore: KeyStore

    beforeAll(async () => {
      keystore = await KeyStore.create({ path: keysPath })
      identities = await Identities.create({ keystore, ipfs })
      identity = await identities.createIdentity({ id })
    })

    afterAll(async () => {
      if (keystore) {
        await keystore.close()
      }
    })

    it('sign data', async () => {
      const signingKey = await keystore.getKey(identity.id)
      const expectedSignature = await signMessage(signingKey!, data)
      const signature = await identities.sign(identity, data)
      assert.strictEqual(signature, expectedSignature)
    })

    it('throws an error if private key is not found from keystore', async () => {
      const { publicKey, signatures } = identity
      const modifiedIdentity = await Identity.create(
        {
          id: 'this id does not exist',
          publicKey,
          signatures,
          type,
        },
      )
      let signature: string | undefined
      let err: string | undefined
      try {
        signature = await identities.sign(modifiedIdentity, data)
      }
      catch (error) {
        err = (error as Error).toString()
      }
      assert.strictEqual(signature, undefined)
      assert.strictEqual(
        err,
        'Error: Private signing key not found from KeyStore',
      )
    })
  })

  describe('verify data signed by an identity', () => {
    const id
      = '03602a3da3eb35f1148e8028f141ec415ef7f6d4103443edbfec2a0711d716f53f'
    const data = 'hello friend'

    let identities: Identities
    let identity: Identity
    let keystore: KeyStore
    let signature: string

    beforeAll(async () => {
      keystore = await KeyStore.create({ path: keysPath })
    })

    beforeEach(async () => {
      identities = await Identities.create({ keystore, ipfs })
      identity = await identities.createIdentity({ id })
      signature = await identities.sign(identity, data)
    })

    afterAll(async () => {
      if (keystore) {
        await keystore.close()
      }
    })

    it('verifies that the signature is valid', async () => {
      const verified = await identities.verify(
        signature,
        identity.publicKey,
        data,
      )
      assert.strictEqual(verified, true)
    })

    it('doesn\'t verify invalid signature', async () => {
      const id = uint8ArrayToString(uint8ArrayFromString('invalid', 'utf8'), 'base16')
      const verified = await identities.verify(
        id,
        identity.publicKey,
        data,
      )
      assert.strictEqual(verified, false)
    })
  })

  describe('manage identity providers', () => {
    it('can add an identity provider', () => {
      IdentityProviderRegistry.useIdentityProvider(CustomIdentityProvider)

      assert.deepStrictEqual(
        IdentityProviderRegistry.getIdentityProvider('custom'),
        CustomIdentityProvider,
      )
    })

    it('cannot add an identity provider with missing type', () => {
      let err: string | undefined

      try {
        IdentityProviderRegistry.useIdentityProvider(
          NoTypeIdentityProvider as unknown as IdentityProvider,
        )
      }
      catch (error) {
        err = (error as Error).toString()
      }

      assert.strictEqual(
        err,
        'Error: Given IdentityProvider doesn\'t have a field \'type\'.',
      )
    })

    it('cannot add an identity provider with missing verifyIdentity', async () => {
      let err: string | undefined

      try {
        IdentityProviderRegistry.useIdentityProvider(
          NoVerifyIdentityIdentityProvider as unknown as IdentityProvider,
        )
      }
      catch (error) {
        err = (error as Error).toString()
      }

      assert.strictEqual(
        err,
        'Error: Given IdentityProvider doesn\'t have a function \'verifyIdentity\'.',
      )
    })
  })
})
