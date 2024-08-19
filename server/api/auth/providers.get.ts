import { ErrNotFound } from '../../errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const e = useEdgeDbQueryBuilder()

  const query = e.select(e.ext.auth.OAuthProviderConfig, () => ({
    name: true,
    display_name: true,
  }))

  const providers = await query.run(client)
  if (!providers) {
    throw ErrNotFound
  }

  return providers
})
