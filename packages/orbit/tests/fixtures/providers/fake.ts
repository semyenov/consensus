import type { IdentityProviderInstance } from '../../../src/identities'

const type = 'fake'

async function verifyIdentity(_data) {
  return false
}

// function FakeIdentityProvider() {
//   return async () => {
//     const getId = () => {
//       return 'pubKey'
//     }

//     const signIdentity = (data) => {
//       return `false signature '${data}'`
//     }

//     return {
//       getId,
//       signIdentity,
//       type,
//     }
//   }
// }

// FakeIdentityProvider.verifyIdentity = verifyIdentity
// FakeIdentityProvider.type = type

class FakeIdentityProvider implements IdentityProviderInstance {
  public readonly type = 'fake'

  getId() {
    return 'pubKey'
  }

  signIdentity = (data: string) => `false signature '${data}'`

  verifyIdentity = verifyIdentity
}
FakeIdentityProvider.type = type

export default FakeIdentityProvider
