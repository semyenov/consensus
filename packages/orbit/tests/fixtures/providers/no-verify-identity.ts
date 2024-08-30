const type = 'no-verify-identity'

function NoVerifyIdentityIdentityProvider() {
  return async () => ({
    type,
  })
}

NoVerifyIdentityIdentityProvider.type = type

export default NoVerifyIdentityIdentityProvider
