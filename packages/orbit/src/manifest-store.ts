import * as dagCbor from '@ipld/dag-cbor'
import { base58btc } from 'multiformats/bases/base58'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import {
  ComposedStorage,
  IPFSBlockStorage,
  LRUStorage,
  type StorageInstance,
} from './storage/index.js'

import type { DatabaseTypeMap } from './databases/index.js'
import type { HeliaInstance } from './vendor.js'

export interface Manifest {
  name: string
  type: keyof DatabaseTypeMap
  accessController: string
  meta?: any
}

export interface ManifestStoreOptions {
  ipfs: HeliaInstance
  storage?: StorageInstance<Uint8Array>
}

export interface ManifestStoreInstance {
  get: (address: string) => Promise<Manifest | null>
  create: (manifest: Manifest) => Promise<{ hash: string; manifest: Manifest }>
  close: () => Promise<void>
}

const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

export class ManifestStore implements ManifestStoreInstance {
  private storage: StorageInstance<Uint8Array>

  private constructor(storage: StorageInstance<Uint8Array>) {
    this.storage = storage
  }

  static create({ ipfs, storage }: ManifestStoreOptions): ManifestStore {
    const storage_ =
      storage ||
      ComposedStorage.create<Uint8Array>({
        storage1: LRUStorage.create({ size: 1000 }),
        storage2: IPFSBlockStorage.create({ ipfs, pin: true }),
      })

    return new ManifestStore(storage_)
  }

  async get(address: string): Promise<Manifest | null> {
    const bytes = await this.storage.get(address)
    if (!bytes) {
      return null
    }

    const { value } = await Block.decode<Manifest, 113, 18>({
      bytes,
      codec,
      hasher,
    })
    return value
  }

  async create({
    name,
    type,
    accessController,
    meta,
  }: Manifest): Promise<{ hash: string; manifest: Manifest }> {
    if (!name) {
      throw new Error('name is required')
    }
    if (!type) {
      throw new Error('type is required')
    }
    if (!accessController) {
      throw new Error('accessController is required')
    }

    const manifest = Object.assign(
      {
        name,
        type,
        accessController,
      },
      // meta field is only added to manifest if meta parameter is defined
      meta !== undefined ? { meta } : {},
    )

    const { cid, bytes } = await Block.encode({
      value: manifest,
      codec,
      hasher,
    })

    const hash = cid.toString(hashStringEncoding)
    await this.storage.put(hash, bytes)

    return {
      hash,
      manifest,
    }
  }

  async close(): Promise<void> {
    await this.storage.close()
  }
}
