import { Octokit } from 'octokit'


type EdgeDbAuthSignupContext = {
  tokenResponseData: {
    identity_id: string
  }
  userData: {
    email: string
    name: string
  }
}

export default defineNitroPlugin((app) => {
  const client = useEdgeDb()

  const { urls } = useEdgeDbEnv()
  const { authBaseUrl, verifyRedirectUrl } = urls
  const pkce = useEdgeDbPKCE()
  const e = useEdgeDbQueryBuilder()

  async function getUser(identity_id: string) {
    return e
      .select(e.User, () => ({
        ...e.User['*'],
      filter_single: e.op(e.ext.auth.Identity.id, '=', e.uuid(identity_id)),
    }))
    .run(client)
  }

  app.hooks.hook(
    'edgedb:auth:signup' as any,
    async ({ tokenResponseData, userData }: EdgeDbAuthSignupContext) => {

  console.log('hook tokenResponseData', tokenResponseData)
      await e
      .insert(e.User, {
        ...userData,
        description: '123',
        identity: await e.select(e.ext.auth.Identity, (identity) => ({
          filter_single: e.op(
            identity.id,
            '=',
            e.uuid(tokenResponseData.identity_id),
          ),
        })),
      })
      .run(client)
    },
  )

  })
