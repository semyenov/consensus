import {
  IPFSAccessController,
  type IPFSAccessControllerInstance,
} from './ipfs'
import {
  OrbitDBAccessController,
  type OrbitDBAccessControllerInstance,
} from './orbitdb'

import type { IdentitiesInstance } from '../identities/identities'
import type { EntryInstance } from '../oplog/entry'
import type { OrbitDBInstance } from '../orbitdb'
import type { StorageInstance } from '../storage'

export interface CreateAccessControllerOptions {
  write?: string[]
  storage?: StorageInstance<Uint8Array>
}

export interface AccessControllerOptions {
  orbitdb: OrbitDBInstance
  identities: IdentitiesInstance
  address?: string
  name?: string
}

export interface AccessControllerInstance {
  type: string
  write: string[]
  address?: string

  canAppend: (entry: EntryInstance) => Promise<boolean>
  close?: () => Promise<void>
  drop?: () => Promise<void>
}

export type AccessControllerTypeMap = {
  ipfs: IPFSAccessControllerInstance
  orbitdb: OrbitDBAccessControllerInstance
}

export interface AccessControllerType<D extends keyof AccessControllerTypeMap> {
  type: D
  create: (...args: any[]) => Promise<AccessControllerTypeMap[D]>
}

const accessControllers: Record<
  string,
  (
    ...args: any[]
  ) => Promise<AccessControllerTypeMap[keyof AccessControllerTypeMap]>
> = {}

export function getAccessController<D extends keyof AccessControllerTypeMap>(type: D) {
  if (!accessControllers[type!]) {
    throw new Error(`AccessController type '${type}' is not supported`)
  }

  return accessControllers[type!]
}

export function useAccessController<
  D extends keyof AccessControllerTypeMap = 'orbitdb',
>(accessController: AccessControllerType<D>) {
  if (!accessController.type) {
    throw new Error('AccessController does not contain required field \'type\'.')
  }

  accessControllers[accessController.type] = accessController.create
}

useAccessController(IPFSAccessController)
useAccessController(OrbitDBAccessController)

export type { IPFSAccessControllerInstance, OrbitDBAccessControllerInstance }
export { IPFSAccessController, OrbitDBAccessController }
