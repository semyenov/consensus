import { PublicKeyIdentityProvider } from './publickey.js'

import type { KeyStoreInstance } from '../../key-store.js'

export interface IdentityProviderGetIdOptions {
  id: string
}

export interface IdentityProviderOptions {
  keystore: KeyStoreInstance
}

export interface IdentityProviderInstance {
  type: string
  getId: (options: IdentityProviderGetIdOptions) => Promise<string>
  signIdentity: (
    data: string,
    options: IdentityProviderGetIdOptions,
  ) => Promise<string>
}

export interface IdentityProviderStatic<
  T extends string,
  U extends IdentityProviderInstance,
> {
  new (options: IdentityProviderOptions): U
  verifyIdentity: (data: any) => Promise<boolean>
  type: T
}

export class IdentityProviderRegistry {
  private static providers = new Map<
    string,
    IdentityProviderStatic<string, IdentityProviderInstance>
  >()

  static isProviderSupported(type: string): boolean {
    return this.providers.has(type)
  }

  static getIdentityProvider(
    type: string,
  ): IdentityProviderStatic<string, IdentityProviderInstance> {
    if (!this.isProviderSupported(type)) {
      throw new Error(`IdentityProvider type '${type}' is not supported`)
    }

    return this.providers.get(type)!
  }

  static useIdentityProvider(
    identityProvider: IdentityProviderStatic<string, any>,
  ): void {
    if (!identityProvider.type || typeof identityProvider.type !== 'string') {
      throw new Error('Given IdentityProvider doesn\'t have a field \'type\'.')
    }

    if (!identityProvider.verifyIdentity) {
      throw new Error(
        'Given IdentityProvider doesn\'t have a function \'verifyIdentity\'.',
      )
    }

    this.providers.set(identityProvider.type, identityProvider)
  }
}

// Register the PublicKeyIdentityProvider
IdentityProviderRegistry.useIdentityProvider(PublicKeyIdentityProvider)

export { PublicKeyIdentityProvider }
export { IdentityProviderRegistry as IdentityProviders }
