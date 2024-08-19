type AuthCallbackContext = {
  verifier: string
  codeExchangeUrl: URL
  codeExchangeResponseData?: {
    auth_token: string
    identity_id: string
    provider_token: string
    provider_refresh_token: string
  }
}

export default defineNitroPlugin((app) => {
  const client = useEdgeDb()
  const e = useEdgeDbQueryBuilder()

  app.hooks.hook(
    'edgedb:auth:callback' as any,
    async ({ codeExchangeResponseData: data }: AuthCallbackContext) => {
      if (!data) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad request',
        })
      }

      const { identity_id, provider_token } = data
      if (!identity_id || !provider_token) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad request',
        })
      }

      const user = await e
        .select(e.User, () => ({
          ...e.User['*'],
          filter_single: e.op(e.ext.auth.Identity.id, '=', e.uuid(identity_id)),
        }))
        .run(client)

      if (!user) {
        await e
          .insert(e.User, {
            name: identity_id,
            description: provider_token,
            email: 'semyenov@hotmail.com',
            identity: e.select(e.ext.auth.Identity, () => ({
              filter_single: e.op(
                e.ext.auth.Identity.id,
                '=',
                e.uuid(identity_id),
              ),
            })),
          })
          .run(client)
      }
    },
  )
})
