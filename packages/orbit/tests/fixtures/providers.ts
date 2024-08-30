function customIdentityProvider() {
  const verifyIdentity = async (_data) => {
    return true
  }

  const CustomIdentityProvider = () => {
    return () => {
      const getId = () => {
        return 'custom'
      }

      const signIdentity = (data) => {
        return `signature '${data}'`
      }

      return {
        getId,
        signIdentity,
        type: 'custom',
      }
    }
  }

  return {
    default: CustomIdentityProvider,
    type: 'custom',
    verifyIdentity,
  }
}

function fakeIdentityProvider() {
  const verifyIdentity = async (_data) => {
    return false
  }

  const FakeIdentityProvider = () => {
    return () => {
      const getId = () => {
        return 'pubKey'
      }

      const signIdentity = (data) => {
        return `false signature '${data}'`
      }

      return {
        getId,
        signIdentity,
        type: 'fake',
      }
    }
  }

  return {
    default: FakeIdentityProvider,
    verifyIdentity,
    type: 'fake',
  }
}

const CustomIdentityProvider = customIdentityProvider()
const FakeIdentityProvider = fakeIdentityProvider()

export { CustomIdentityProvider, FakeIdentityProvider }
