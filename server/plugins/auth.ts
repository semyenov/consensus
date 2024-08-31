import { Octokit } from 'octokit'

type EdgeDbAuthCallbackContext = {
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
    async ({ codeExchangeResponseData: data }: EdgeDbAuthCallbackContext) => {
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

      const octokit = new Octokit({
        auth: provider_token,
      })

      const { data: userData } = await octokit.request('GET /user')
      if (!user) {
        await e
          .insert(e.User, {
            name: userData.name ?? '',
            description: userData.bio ?? '',
            email: userData.email ?? '',
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

      const { data: issuesData } = await octokit.request('GET /user/issues', {
        filter: 'all',
      })

      await Promise.all(
        issuesData.map(async (issue) => {
          await e
            .insert(e.issue.Issue, {
              name: `#${issue.id} ${issue.title}`,
              description: issue.body_text ?? '',
              content: issue.body_html ?? '',
              priority: e.issue.IssuePriority.Low,
              status:
                issue.state === 'open'
                  ? e.issue.IssueStatus.Open
                  : e.issue.IssueStatus.Closed,
              created_at: e.datetime(issue.created_at),
              updated_at: e.datetime(issue.updated_at),
              author: e.select(e.User, user => ({
                filter_single: e.op(user.identity.id, '=', e.uuid(identity_id)),
              })),
              assignee: e.select(e.User, user => ({
                filter_single: e.op(user.identity.id, '=', e.uuid(identity_id)),
              })),
            })
            .run(client.withConfig({ apply_access_policies: false }))
        }),
      )
    },
  )
})
