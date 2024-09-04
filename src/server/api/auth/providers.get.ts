import { prop, uniqueBy } from 'remeda'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const e = useEdgeDbQueryBuilder()

  const query = e.select(e.ext.auth.OAuthProviderConfig, () => ({
    display_name: true,
    name: true,
  }))

  return query.run(client)
    .then(results => uniqueBy(results, prop('name')))
})
