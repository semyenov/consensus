import {
  type AccessControllerInstance,
  type AccessControllerTypeMap,
  getAccessController,
} from './access-controllers/index'
import { IPFSAccessController } from './access-controllers/ipfs'
import { OrbitDBAddress } from './address'
import { DATABASE_DEFAULT_TYPE } from './constants'
import { type DatabaseTypeMap, getDatabaseType } from './databases/index'
import {
  Identities,
  type IdentitiesInstance,
  type IdentityInstance,
} from './identities/index'
import { KeyStore, type KeyStoreInstance } from './key-store'
import { type Manifest, ManifestStore } from './manifest-store'
import { join } from './utils'
import { createId } from './utils/index'

import type { StorageInstance } from './storage/index'
import type { HeliaInstance, PeerId } from './vendor'

export interface OrbitDBOpenOptions<T, D extends keyof DatabaseTypeMap> {
  type?: D

  meta?: any
  sync?: boolean
  address?: string
  referencesCount?: number

  Database?: (...args: any[]) => DatabaseTypeMap<T>[D]
  AccessController?: (
    ...args: any[]
  ) => Promise<AccessControllerTypeMap[keyof AccessControllerTypeMap]>

  headsStorage?: StorageInstance<Uint8Array>
  entryStorage?: StorageInstance<Uint8Array>
  indexStorage?: StorageInstance<boolean>
}

export interface OrbitDBOptions {
  id?: string
  ipfs: HeliaInstance
  identity?: IdentityInstance
  identities?: IdentitiesInstance
  directory?: string
}

export interface OrbitDBInstance {
  id: string
  ipfs: HeliaInstance
  directory: string
  identity: IdentityInstance
  peerId: PeerId

  open: <D extends keyof DatabaseTypeMap, T = unknown>(
    type: D,
    address: string,
    options: OrbitDBOpenOptions<T, D>,
  ) => Promise<DatabaseTypeMap<T>[D]>
  stop: () => Promise<void>
}

const DEFAULT_ACCESS_CONTROLLER = IPFSAccessController.create

export class OrbitDB implements OrbitDBInstance {
  public readonly id: string
  public readonly ipfs: HeliaInstance
  public readonly directory: string
  // public keystore: KeyStoreInstance
  public readonly identity: IdentityInstance
  public readonly peerId: PeerId

  private readonly identities: IdentitiesInstance
  private readonly manifestStore: ManifestStore
  private readonly databases: Record<
    string,
    DatabaseTypeMap<any>[keyof DatabaseTypeMap<any>]
  > = {}

  private constructor(
    id: string,
    ipfs: HeliaInstance,
    directory: string,
    identity: IdentityInstance,
    identities: IdentitiesInstance,
    manifestStore: ManifestStore,
  ) {
    this.id = id
    this.ipfs = ipfs
    this.directory = directory
    this.identity = identity
    this.peerId = ipfs.libp2p.peerId
    this.identities = identities
    this.manifestStore = manifestStore
  }

  static async create(options: OrbitDBOptions): Promise<OrbitDB> {
    if (options.ipfs === null) {
      throw new Error('IPFS instance is a required argument.')
    }

    let { identities } = options
    const {
      ipfs,
      directory = './orbitdb',
      id = await createId(),
    } = options

    if (!identities) {
      const keystore = await KeyStore.create({
        path: join(directory, './keystore'),
      })
      identities = await Identities.create({
        ipfs,
        keystore,
      })
    }

    const getIdentity = async (identity?: IdentityInstance) => {
      if (identity) {
        if (typeof identity.provider === 'function') {
          return identities.createIdentity({
            id: identity.id,
            provider: identity.provider,
          })
        }

        return identity
      }

      return identities.createIdentity({ id })
    }

    const identity = await getIdentity(options.identity)
    const manifestStore = ManifestStore.create({ ipfs })

    return new OrbitDB(
      id,
      ipfs,
      directory,
      identity,
      identities,
      manifestStore,
    )
  }

  async open<D extends keyof DatabaseTypeMap, T = unknown>(
    type: D,
    address: string,
    options: OrbitDBOpenOptions<T, D> = {},
  ): Promise<DatabaseTypeMap<T>[D]> {
    let type_: D = type
    let address_: string = address

    let name: string
    let manifest: Manifest | null
    let accessController: AccessControllerInstance
    let { meta, sync, headsStorage, entryStorage, indexStorage, referencesCount } = options

    if (this.databases[address_]) {
      return this.databases[address_] as DatabaseTypeMap<T>[D]
    }

    if (OrbitDBAddress.isValidAddress(address_)) {
      const addr = OrbitDBAddress.create(address_)
      manifest = await this.manifestStore.get(addr.hash)
      if (!manifest) {
        throw new Error(`Manifest not found for address: ${address_}`)
      }

      const acType = manifest.accessController
        .split('/', 2)
        .pop()! as keyof AccessControllerTypeMap

      const AccessController = getAccessController(acType)
      if (!AccessController) {
        throw new Error(`Unsupported access controller type: '${acType}'`)
      }

      accessController = await AccessController({
        orbitdb: this,
        identities: this.identities,
        address: manifest.accessController,
      })

      name = manifest?.name ?? ''
      meta ||= manifest.meta

      type_ = type || manifest.type
    }
    else {
      type_ = type || DATABASE_DEFAULT_TYPE

      const AccessController
        = options.AccessController || DEFAULT_ACCESS_CONTROLLER

      accessController = await AccessController({
        orbitdb: this,
        identities: this.identities,
      })

      const m = await this.manifestStore.create({
        name: address_,
        type: type_,
        accessController: accessController.address!,
        meta,
      })

      address_ = m.hash

      const { manifest } = m
      name = manifest?.name
      meta ||= manifest.meta

      if (this.databases[address_] as DatabaseTypeMap<T>[D]) {
        return this.databases[address_] as DatabaseTypeMap<T>[typeof type]
      }
    }

    const Database = options.Database || getDatabaseType(type_)
    if (!Database) {
      throw new Error(`Unsupported database type: '${type}'`)
    }

    const database = (await Database({
      ipfs: this.ipfs,
      identity: this.identity,
      address: address_,
      name,
      meta,
      accessController,
      directory: this.directory,
      syncAutomatically: sync,
      headsStorage,
      entryStorage,
      indexStorage,
      referencesCount,
    })) as DatabaseTypeMap<T>[typeof type]

    database.events.addEventListener('close', this.onDatabaseClosed(address_))
    this.databases[address_] = database

    return database
  }

  private onDatabaseClosed = (address: string) => (): void => {
    delete this.databases[address!]
  }

  async stop(): Promise<void> {
    for (const database of Object.values(this.databases)) {
      await database.close()
    }
    if (this.identities.keystore) {
      await this.identities.keystore.close()
    }
    if (this.manifestStore) {
      await this.manifestStore.close()
    }

    for (const key of Object.keys(this.databases)) {
      delete this.databases[key!]
    }
  }
}

export { OrbitDBAddress }
