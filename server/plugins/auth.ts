import { Octokit, createNodeMiddleware } from 'octokit'
import { map, pipe } from 'remeda'

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
      console.log(data)

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

      const octokit = new Octokit({
        auth: provider_token,
      })

      const { data: info } = await octokit.request('GET /user/issues', {
        filter: 'all',
      })

      console.log(info)

      const issues = await Promise.all(info.map(async (issue) => {
        await e.insert(e.issue.Issue, {
          name: issue.title,
          description: issue.body_text ?? '',
          content: issue.body_html ?? '',
          priority: e.issue.IssuePriority.Low,
          status: issue.state === 'closed' ? 'Closed' : 'Open',
          // assignee: issue.assignee && e.select(e.User, () => ({
          //   filter_single: e.op(e.User.identity.subject, '=', issue.assignee!.id),
          // })),
          created_at: e.datetime(issue.created_at),
          updated_at: e.datetime(issue.updated_at),
          author: e.select(e.User, () => ({
            filter_single: e.op(e.User.id, '=', e.uuid(user!.id)),
          })),
          assignee: e.select(e.User, () => ({
            filter_single: e.op(e.User.id, '=', e.uuid(user!.id)),
          })),
        })
          .run(client.withConfig({ apply_access_policies: false }))
      }))

      console.log(issues)
    },
  )
})
