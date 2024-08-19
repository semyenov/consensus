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
    async (ctx: AuthCallbackContext) => {
      const { codeExchangeResponseData } = ctx
      if (!codeExchangeResponseData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad request',
        })
      }
      const user = await e
        .select(e.User, () => ({
          ...e.User['*'],
          filter_single: e.op(
            e.ext.auth.Identity.id,
            '=',
            e.uuid(codeExchangeResponseData.identity_id),
          ),
        }))
        .run(client)

      if (user) {
        console.log(user)

        return ctx
      }

      const { identity_id, provider_token } = codeExchangeResponseData
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
    },
  )
})
