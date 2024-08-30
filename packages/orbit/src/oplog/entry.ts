import * as dagCbor from '@ipld/dag-cbor'
import { base58btc } from 'multiformats/bases/base58'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import { Clock, type ClockInstance } from './clock.js'

import type { IdentityInstance } from '../identities'

const codec = dagCbor
const hasher = sha256
const hashStringEncoding = base58btc

export interface EntryInstance<T = unknown> {
  id: string
  payload: T
  next: string[]
  refs: string[]
  clock: ClockInstance
  v: number
  key?: string
  hash?: string
  identity?: string
  bytes?: Uint8Array
  sig?: string
}

export const Entry = {
  async create<T>(
    identity: IdentityInstance,
    id: string,
    payload: T,
    clock?: ClockInstance,
    next?: string[],
    refs: string[] = [],
  ): Promise<EntryInstance<T>> {
    if (!identity) {
      throw new Error('Identity is required, cannot create entry')
    }
    if (!id) {
      throw new Error('Entry requires an id')
    }
    if (!payload) {
      throw new Error('Entry requires a payload')
    }
    if (!next || !Array.isArray(next)) {
      throw new Error('\'next\' argument is not an array')
    }

    const entry: EntryInstance<T> = {
      id,
      payload,
      next,
      refs,
      clock: clock || new Clock(identity.publicKey),
      v: 2,
    }

    const { bytes, cid } = await Block.encode({ value: entry, codec, hasher })

    const signature = await identity.sign!(bytes)

    entry.key = identity.publicKey
    entry.identity = identity.hash
    entry.sig = signature

    return await this.encode2(entry)
  },

  async verify<T>(
    identities: {
      verify?: (
        signature: string,
        publicKey: string,
        data: string | Uint8Array,
      ) => Promise<boolean>
    },
    entry: EntryInstance<T>,
  ): Promise<boolean> {
    if (!identities) {
      throw new Error('Identities is required, cannot verify entry')
    }
    if (!Entry.isEntry(entry)) {
      throw new Error('Invalid Log entry')
    }
    if (!entry.key) {
      throw new Error('Entry doesn\'t have a key')
    }
    if (!entry.sig) {
      throw new Error('Entry doesn\'t have a signature')
    }

    const value = {
      id: entry.id,
      payload: entry.payload,
      next: entry.next,
      refs: entry.refs,
      clock: entry.clock,
      v: entry.v,
    }

    const { bytes } = await Block.encode<EntryInstance<T>, 113, 18>({
      value,
      codec,
      hasher,
    })

    return identities.verify!(entry.sig, entry.key, bytes)
  },

  isEntry(obj: any): obj is EntryInstance {
    return (
      obj
      && obj.id !== undefined
      && obj.next !== undefined
      && obj.payload !== undefined
      && obj.v !== undefined
      && obj.clock !== undefined
      && obj.refs !== undefined
    )
  },

  isEqual<T>(a: EntryInstance<T>, b: EntryInstance<T>): boolean {
    return a && b && a.hash === b.hash
  },

  async decode<T>(bytes: Uint8Array): Promise<EntryInstance<T>> {
    const { value, cid } = await Block.decode<EntryInstance<T>, 113, 18>({
      bytes,
      codec,
      hasher,
    })

    const hash = cid.toString(hashStringEncoding)

    return { ...value, hash, bytes }
  },

  async encode2<T>(entry: EntryInstance<T>) {
    const { bytes, cid } = await Block.encode({
      value: entry,
      codec,
      hasher,
    })

    entry.hash = cid.toString(hashStringEncoding)
    entry.bytes = bytes

    return entry
  },

  async encode(entry: EntryInstance): Promise<Uint8Array> {
    const { bytes } = await Block.encode({
      value: entry,
      codec,
      hasher,
    })

    return bytes
  },
}
