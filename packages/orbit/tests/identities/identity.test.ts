import assert from 'node:assert'

import { beforeAll, beforeEach, describe, it } from 'vitest'

import { Identity } from '../../src/identities'

describe('identity', () => {
  const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
  const publicKey = '<pubkey>'
  const signatures = {
    id: 'signature for <id>',
    publicKey: 'signature for <publicKey + idSignature>',
  }

  const type = 'orbitdb'

  const expectedHash = 'zdpuArx43BnXdDff5rjrGLYrxUomxNroc2uaocTgcWK76UfQT'
  const expectedBytes = Uint8Array.from([
    164,
    98,
    105,
    100,
    120,
    39,
    48,
    120,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    48,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    100,
    116,
    121,
    112,
    101,
    103,
    111,
    114,
    98,
    105,
    116,
    100,
    98,
    105,
    112,
    117,
    98,
    108,
    105,
    99,
    75,
    101,
    121,
    104,
    60,
    112,
    117,
    98,
    107,
    101,
    121,
    62,
    106,
    115,
    105,
    103,
    110,
    97,
    116,
    117,
    114,
    101,
    115,
    162,
    98,
    105,
    100,
    114,
    115,
    105,
    103,
    110,
    97,
    116,
    117,
    114,
    101,
    32,
    102,
    111,
    114,
    32,
    60,
    105,
    100,
    62,
    105,
    112,
    117,
    98,
    108,
    105,
    99,
    75,
    101,
    121,
    120,
    39,
    115,
    105,
    103,
    110,
    97,
    116,
    117,
    114,
    101,
    32,
    102,
    111,
    114,
    32,
    60,
    112,
    117,
    98,
    108,
    105,
    99,
    75,
    101,
    121,
    32,
    43,
    32,
    105,
    100,
    83,
    105,
    103,
    110,
    97,
    116,
    117,
    114,
    101,
    62,
  ])

  let identity: Identity

  beforeAll(async () => {
    identity = await Identity.create({ id, publicKey, signatures, type })
  })

  it('has the correct id', async () => {
    assert.strictEqual(identity.id, id)
  })

  it('has the correct publicKey', async () => {
    assert.strictEqual(identity.publicKey, publicKey)
  })

  it('has the correct idSignature', async () => {
    assert.strictEqual(identity.signatures.id, signatures.id)
  })

  it('has the correct publicKeyAndIdSignature', async () => {
    assert.strictEqual(identity.signatures.publicKey, signatures.publicKey)
  })

  describe('constructor inputs', () => {
    it('throws and error if id was not given in constructor', async () => {
      let err: string | undefined
      try {
        identity = await Identity.create({} as any)
      }
      catch (error) {
        err = (error as Error).toString()
      }
      assert.strictEqual(err, 'Error: Identity id is required')
    })

    // ... (other similar test cases)
  })

  describe('isIdentity', () => {
    describe('valid Identity', () => {
      it('is a valid identity', async () => {
        const currentIdentity = await Identity.create({ id, publicKey, signatures, type })
        const result = Identity.isIdentity(currentIdentity)
        assert.strictEqual(result, true)
      })
    })

    describe('invalid Identity', () => {
      beforeEach(async () => {
        identity = await Identity.create({ id, publicKey, signatures, type })
      })

      it('is not a valid identity if id is missing', async () => {
        const invalidIdentity = { ...identity, id: undefined } as any
        const result = Identity.isIdentity(invalidIdentity)
        assert.strictEqual(result, false)
      })

      // ... (other similar test cases)
    })
  })

  describe('isEqual', () => {
    describe('equal identities', () => {
      it('identities are equal', async () => {
        const identity1 = await Identity.create({ id, publicKey, signatures, type })
        const identity2 = await Identity.create({ id, publicKey, signatures, type })
        const result = Identity.isEqual(identity1, identity2)
        assert.strictEqual(result, true)
      })
    })

    describe('not equal identities', () => {
      let identity1: Identity
      let identity2: Identity

      beforeAll(async () => {
        identity1 = await Identity.create({ id, publicKey, signatures, type })
        identity2 = await Identity.create({ id, publicKey, signatures, type })
      })

      it('identities are not equal if id is different', async () => {
        identity2 = await Identity.create({ id: 'X', publicKey, signatures, type })
        const result = Identity.isEqual(identity1, identity2)
        assert.strictEqual(result, false)
      })

      // ... (other similar test cases)
    })
  })

  describe('decode Identity', () => {
    beforeAll(async () => {
      identity = await Identity.create({ id, publicKey, signatures, type })
    })

    it('decodes an identity from bytes', async () => {
      const result = await Identity.decode(expectedBytes)

      assert.strictEqual(Identity.isIdentity(result), true)
      assert.strictEqual(result.id, id)
      assert.strictEqual(result.publicKey, publicKey)
      assert.strictEqual(result.type, type)
      assert.strictEqual(result.hash, expectedHash)
      assert.strictEqual(result.sign, undefined)
      assert.strictEqual(result.verify, undefined)
      assert.deepStrictEqual(result.bytes, expectedBytes)
      assert.deepStrictEqual(result.signatures, signatures)
    })
  })
})
