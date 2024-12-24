import * as dagCbor from '@ipld/dag-cbor'
import { base58btc } from 'multiformats/bases/base58'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import type { IdentityProviderInstance } from './providers'

export interface IdentitySignatures {
  id: string
  publicKey: string
}

export interface IdentityOptions {
  id: string
  type: string
  publicKey: string
  signatures: IdentitySignatures
  provider?: IdentityProviderInstance
  sign?: (data: any) => Promise<string>
  verify?: (signature: string, publicKey: string, data: string | Uint8Array) => Promise<boolean>
}

export interface IdentityInstance extends IdentityOptions {
  hash: string
  bytes: Uint8Array
}

const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

export class Identity implements IdentityInstance {
  id: string
  type: string
  publicKey: string
  signatures: IdentitySignatures
  provider?: IdentityProviderInstance
  sign?: (data: any) => Promise<string>
  verify?: (signature: string, publicKey: string, data: string | Uint8Array) => Promise<boolean>
  hash: string
  bytes: Uint8Array

  private constructor(
    options: IdentityOptions & { hash: string, bytes: Uint8Array },
  ) {
    this.id = options.id
    this.type = options.type
    this.publicKey = options.publicKey
    this.signatures = options.signatures
    this.provider = options.provider
    this.sign = options.sign
    this.verify = options.verify
    this.hash = options.hash
    this.bytes = options.bytes
  }

  static async create(options: IdentityOptions): Promise<Identity> {
    Identity.validateOptions(options)
    const { hash, bytes } = await Identity.encodeIdentity(options)

    return new Identity({ ...options, hash, bytes })
  }

  private static validateOptions(options: IdentityOptions): void {
    if (!options.id) {
      throw new Error('Identity id is required')
    }
    if (!options.publicKey) {
      throw new Error('Invalid public key')
    }
    if (!options.signatures) {
      throw new Error('Signatures object is required')
    }
    if (!options.signatures.id) {
      throw new Error('Signature of id is required')
    }
    if (!options.signatures.publicKey) {
      throw new Error('Signature of publicKey+id is required')
    }
    if (!options.type) {
      throw new Error('Identity type is required')
    }
  }

  private static async encodeIdentity(
    identity: IdentityOptions,
  ): Promise<{ hash: string, bytes: Uint8Array }> {
    const { id, publicKey, signatures, type } = identity
    const value = { id, publicKey, signatures, type }
    const { cid, bytes } = await Block.encode({ value, codec, hasher })
    const hash = cid.toString(hashStringEncoding)

    return { hash, bytes: Uint8Array.from(bytes) }
  }

  static async decode(bytes: Uint8Array): Promise<Identity> {
    const { value } = await Block.decode<IdentityOptions, 113, 18>({
      bytes,
      codec,
      hasher,
    })

    return Identity.create(value)
  }

  static isIdentity(identity: any): identity is Identity {
    return identity instanceof Identity
  }

  static isEqual(a: Identity, b: Identity): boolean {
    return (
      a.id === b.id
      && a.hash === b.hash
      && a.type === b.type
      && a.publicKey === b.publicKey
      && a.signatures.id === b.signatures.id
      && a.signatures.publicKey === b.signatures.publicKey
    )
  }
}
