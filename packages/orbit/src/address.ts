import { base58btc } from 'multiformats/bases/base58'
import { CID } from 'multiformats/cid'

import { posixJoin } from './utils/path-join.js'

export interface OrbitDBAddressInstance {
  protocol: string
  hash: string
  address: string
  toString: () => string
}

export class OrbitDBAddress implements OrbitDBAddressInstance {
  readonly protocol: string = 'orbitdb'
  readonly hash: string
  readonly address: string

  constructor(address: string) {
    this.address = address
    this.hash = address.replace('/orbitdb/', '')
      .replace('\\orbitdb\\', '')
  }

  static create(
    address: string | OrbitDBAddressInstance,
  ): OrbitDBAddressInstance {
    if (typeof address !== 'string') {
      return address
    }

    return new OrbitDBAddress(address)
  }

  toString(): string {
    return posixJoin('/', this.protocol, this.hash)
  }

  static isValidAddress(address: string): boolean {
    let address_ = address.toString()

    if (
      !address_.startsWith('/orbitdb')
      && !address_.startsWith(String.raw`\orbitdb`)
    ) {
      return false
    }

    address_ = address_.replaceAll('/orbitdb/', '')
    address_ = address_.replaceAll('\\orbitdb\\', '')
    address_ = address_.replaceAll('/', '')
    address_ = address_.replaceAll('\\', '')

    let cid
    try {
      cid = CID.parse(address_, base58btc)
    }
    catch {
      return false
    }

    return cid !== undefined
  }

  static parseAddress(address: string): OrbitDBAddressInstance {
    if (!address) {
      throw new Error(`Not a valid OrbitDB address: ${address}`)
    }

    if (!OrbitDBAddress.isValidAddress(address)) {
      throw new Error(`Not a valid OrbitDB address: ${address}`)
    }

    return OrbitDBAddress.create(address)
  }
}
