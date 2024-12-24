import * as dagCbor from '@ipld/dag-cbor'
import { base58btc } from 'multiformats/bases/base58'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import { ACCESS_CONTROLLER_IPFS_TYPE } from '../constants'
import {
  ComposedStorage,
  IPFSBlockStorage,
  LRUStorage,
  type StorageInstance,
} from '../storage/index'
import { join } from '../utils'

import type { AccessControllerInstance } from './index'
import type { IdentitiesInstance } from '../identities/index'
import type { EntryInstance } from '../oplog/entry'
import type { OrbitDBInstance } from '../orbitdb'

const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

async function AccessControlList({
  storage,
  type,
  params,
}: {
  storage: StorageInstance<any>
  type: string
  params: Record<string, any>
}) {
  const manifest = {
    type,
    ...params,
  }
  const { cid, bytes } = await Block.encode({ value: manifest, codec, hasher })
  const hash = cid.toString(hashStringEncoding)
  await storage.put(hash, bytes)

  return hash
}

export interface IPFSAccessControllerInstance extends AccessControllerInstance {
  type: string
  address: string
  write: string[]

  canAppend: (entry: EntryInstance) => Promise<boolean>
}

export class IPFSAccessController implements IPFSAccessControllerInstance {
  public address: string
  public write: string[]

  get type(): 'ipfs' {
    return ACCESS_CONTROLLER_IPFS_TYPE
  }

  static get type(): 'ipfs' {
    return ACCESS_CONTROLLER_IPFS_TYPE
  }

  private storage: StorageInstance<any>
  private orbitdb: OrbitDBInstance
  private identities: IdentitiesInstance

  private constructor(
    orbitdb: OrbitDBInstance,
    identities: IdentitiesInstance,
    address: string,
    write: string[],
    storage: StorageInstance<any>,
  ) {
    this.orbitdb = orbitdb
    this.identities = identities
    this.address = address
    this.write = write
    this.storage = storage
  }

  static async create(options: {
    orbitdb: OrbitDBInstance
    identities: IdentitiesInstance
    address?: string
    write?: string[]
    storage?: StorageInstance<any>
  }): Promise<IPFSAccessControllerInstance> {
    const { ipfs } = options.orbitdb
    const { identities } = options
    const storage
      = options.storage
      || ComposedStorage.create({
        storage1: LRUStorage.create({ size: 1000 }),
        storage2: IPFSBlockStorage.create({
          ipfs,
          pin: true,
        }),
      })

    let { address } = options
    let write = options.write || [options.orbitdb.identity.id]

    if (address) {
      const manifestBytes = await storage.get(address.replaceAll('/ipfs/', ''))

      const { value } = await Block.decode<{ write: string[] }, 113, 18>({
        bytes: manifestBytes!,
        codec,
        hasher,
      })

      write = value.write
    }
    else {
      address = await AccessControlList({
        type: ACCESS_CONTROLLER_IPFS_TYPE,
        storage,
        params: { write },
      })
      address = join('/', ACCESS_CONTROLLER_IPFS_TYPE, address)
    }

    const controller = new IPFSAccessController(
      options.orbitdb,
      identities,
      address,
      write,
      storage,
    )

    return controller
  }

  async canAppend(entry: EntryInstance): Promise<boolean> {
    const writerIdentity = await this.identities.getIdentity(entry.identity!)
    if (!writerIdentity) {
      return false
    }
    const { id } = writerIdentity
    // Allow if the write access list contain the writer's id or is '*'
    if (this.write.includes(id) || this.write.includes('*')) {
      // Check that the identity is valid
      return this.identities.verifyIdentity(writerIdentity)
    }

    return false
  }
}
