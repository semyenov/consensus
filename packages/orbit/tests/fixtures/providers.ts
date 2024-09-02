function customIdentityProvider() {
  const verifyIdentity = async _data => true

  const CustomIdentityProvider = () => () => {
    const getId = () => 'custom'

    const signIdentity = data => `signature '${data}'`

    return {
      getId,
      signIdentity,
      type: 'custom',
    }
  }

  return {
    default: CustomIdentityProvider,
    type: 'custom',
    verifyIdentity,
  }
}

function fakeIdentityProvider() {
  const verifyIdentity = async _data => false

  const FakeIdentityProvider = () => () => {
    const getId = () => 'pubKey'

    const signIdentity = data => `false signature '${data}'`

    return {
      getId,
      signIdentity,
      type: 'fake',
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
