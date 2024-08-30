import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import { IDENTITIES_PROVIDER_PUBLICKEY } from '../../constants.js'
import { signMessage, verifyMessage } from '../../key-store.js'

import type { IdentityInstance } from '../identity.js'
import type {
  IdentityProviderInstance,
  IdentityProviderOptions,
  // IdentityProviderStatic,
} from '../providers'

export class PublicKeyIdentityProvider implements IdentityProviderInstance {
  static type: 'publickey' = IDENTITIES_PROVIDER_PUBLICKEY
  private keystore: IdentityProviderOptions['keystore']

  public type: 'publickey' = IDENTITIES_PROVIDER_PUBLICKEY

  constructor({ keystore }: IdentityProviderOptions) {
    if (!keystore) {
      throw new Error('PublicKeyIdentityProvider requires a keystore parameter')
    }
    this.keystore = keystore
  }

  async getId({ id }: { id: string }): Promise<string> {
    if (!id) {
      throw new Error('id is required')
    }

    const key
      = (await this.keystore.getKey(id)) || (await this.keystore.createKey(id))

    return uint8ArrayToString(key.public.marshal(), 'base16')
  }

  async signIdentity(data: string, { id }: { id: string }): Promise<string> {
    if (!id) {
      throw new Error('id is required')
    }

    const key = await this.keystore.getKey(id)
    if (!key) {
      throw new Error(`Signing key for '${id}' not found`)
    }

    return signMessage(key, data)
  }

  static async verifyIdentity(identity: IdentityInstance): Promise<boolean> {
    const { id, publicKey, signatures } = identity

    return verifyMessage(signatures.publicKey, id, publicKey + signatures.id)
  }
}

// Type assertion to ensure PublicKeyIdentityProvider conforms to IdentityProviderStatic
// const _: IdentityProviderStatic<'publickey', PublicKeyIdentityProvider> =
// PublicKeyIdentityProvider
