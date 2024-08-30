import type { IdentityProviderInstance } from '@orbitdb/core'

const type = 'custom'

async function verifyIdentity(_data) {
  return true
}

// function CustomIdentityProvider() {
//   return async () => {
//     const getId = () => {
//       return 'custom'
//     }

//     const signIdentity = (data) => {
//       return `signature '${data}'`
//     }

//     return {
//       getId,
//       signIdentity,
//       type,
//     } as IdentityProviderInstance
//   }
// }

class CustomIdentityProvider implements IdentityProviderInstance {
  static type = 'custom'

  constructor() {
    console.log('CustomIdentityProvider.constructor')
  }

  signIdentity() {
    return 'false signature'
  }

  getId = () => 'pubKey'

  static signIdentity = data => `false signature '${data}'`

  static verifyIdentity = verifyIdentity
}

// CustomIdentityProvider.type = type

export default CustomIdentityProvider
