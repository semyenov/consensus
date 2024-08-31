import * as crypto from '@libp2p/crypto'
import {
  compare as uint8ArrayCompare,
  fromString as uint8ArrayFromString,
  toString as uint8ArrayToString,
} from 'uint8arrays'

import { KEYSTORE_PATH } from './constants'
import { ComposedStorage, LRUStorage, LevelStorage } from './storage/index'

import type { StorageInstance } from './storage'
import type { PrivateKey } from './vendor'

export interface KeyStoreOptions {
  storage?: StorageInstance<Uint8Array>
  path?: string
}

export interface KeyStoreInstance {
  createKey: (id: string) => Promise<PrivateKey<'secp256k1'>>
  hasKey: (id: string) => Promise<boolean>
  addKey: (id: string, key: PrivateKey<'secp256k1'>) => Promise<void>
  removeKey: (id: string) => Promise<void>
  getKey: (id: string) => Promise<PrivateKey<'secp256k1'> | null>
  getPublic: (key: PrivateKey<'secp256k1'>) => string
  clear: () => Promise<void>
  close: () => Promise<void>
}

const VERIFIED_CACHE_STORAGE = Promise.resolve(LRUStorage.create<{
  publicKey: string
  data: string | Uint8Array
}>({ size: 1000 }))

const unmarshal
  = crypto.keys.supportedKeys.secp256k1.unmarshalSecp256k1PrivateKey
const unmarshalPubKey
  = crypto.keys.supportedKeys.secp256k1.unmarshalSecp256k1PublicKey

export class KeyStore implements KeyStoreInstance {
  private storage: StorageInstance<Uint8Array>

  private constructor(storage: StorageInstance<Uint8Array>) {
    this.storage = storage
  }

  static async create(options: KeyStoreOptions): Promise<KeyStore> {
    const path = options.path || KEYSTORE_PATH
    const storage: StorageInstance<Uint8Array>
      = options.storage
      || ComposedStorage.create<Uint8Array>({
        storage1: await Promise.resolve(LRUStorage.create({ size: 1000 })),
        storage2: await LevelStorage.create({ path }),
      })

    return new KeyStore(storage)
  }

  async clear(): Promise<void> {
    await this.storage.clear()
  }

  async close(): Promise<void> {
    await this.storage.close()
  }

  async hasKey(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('id needed to check a key')
    }

    let hasKey = false
    try {
      const storedKey = await this.storage.get(`private_${id}`)
      hasKey = storedKey !== undefined && storedKey !== null
    }
    catch {
      // eslint-disable-next-line no-console
      console.error('Error: ENOENT: no such file or directory')
    }

    return hasKey
  }

  async addKey(id: string, key: PrivateKey<'secp256k1'>): Promise<void> {
    await this.storage.put(`private_${id}`, key.marshal())
  }

  async createKey(id: string): Promise<PrivateKey<'secp256k1'>> {
    if (!id) {
      throw new Error('id needed to create a key')
    }

    const keys = await crypto.keys.generateKeyPair('secp256k1')
    await this.storage.put(`private_${id}`, keys.marshal())

    return keys
  }

  async getKey(id: string): Promise<PrivateKey<'secp256k1'> | null> {
    if (!id) {
      throw new Error('id needed to get a key')
    }

    const storedKey = await this.storage.get(`private_${id}`)
    if (!storedKey) {
      return null
    }

    return unmarshal(storedKey)
  }

  getPublic(keys: PrivateKey<'secp256k1'>): string {
    if (!keys) {
      throw new Error('keys needed to get a public key')
    }

    return uint8ArrayToString(keys.public.marshal(), 'base16')
  }

  async removeKey(id: string): Promise<void> {
    if (!id) {
      throw new Error('id needed to remove a key')
    }

    await this.storage.del(`private_${id}`)
  }
}

function ensureUint8Array(data: Uint8Array | string) {
  return (typeof data === 'string'
    ? uint8ArrayFromString(data, 'utf8')
    : new Uint8Array(data))
}

async function verify(
  publicKey: string,
  signature: string,
  data: Uint8Array | string,
) {
  const pubKey = unmarshalPubKey(uint8ArrayFromString(publicKey, 'base16'))
  if (!pubKey) {
    throw new Error('Public key could not be decoded')
  }

  return pubKey.verify(
    ensureUint8Array(data),
    uint8ArrayFromString(signature, 'base16'),
  )
}

async function verifySignature(
  signature: string,
  publicKey: string,
  data: Uint8Array | string,
) {
  if (!signature) {
    throw new Error('No signature given')
  }
  if (!publicKey) {
    throw new Error('Given publicKey was undefined')
  }
  if (!data) {
    throw new Error('Given input data was undefined')
  }

  return verify(publicKey, signature, data)
}

export async function signMessage(
  key: PrivateKey<'secp256k1'>,
  data: string | Uint8Array,
): Promise<string> {
  if (!key) {
    throw new Error('No signing key given')
  }

  if (!data) {
    throw new Error('Given input data was undefined')
  }

  const signature = await key.sign(
    ensureUint8Array(data),
  )

  return uint8ArrayToString(signature, 'base16')
}

export async function verifyMessage(
  signature: string,
  publicKey: string,
  data: string | Uint8Array,
): Promise<boolean> {
  const verifiedCache = await VERIFIED_CACHE_STORAGE
  const cached = await verifiedCache.get(signature)
  if (!cached) {
    const verified = await verifySignature(signature, publicKey, data)
    if (verified) {
      await verifiedCache.put(signature, {
        publicKey,
        data,
      })
    }

    return verified
  }

  const compare = (cached: string | Uint8Array, data: string | Uint8Array) => {
    const match = data instanceof Uint8Array && cached instanceof Uint8Array
      ? uint8ArrayCompare(cached, data) === 0
      : cached.toString() === data.toString()

    return match
  }

  return cached.publicKey === publicKey && compare(cached.data, data)
}
