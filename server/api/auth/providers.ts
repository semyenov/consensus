import { ErrNotFound } from '../../errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const e = useEdgeDbQueryBuilder()

  const query = e.select(e.ext.auth.ProviderConfig, () => {
    return {
      ...e.ext.auth.ProviderConfig['*'],
      filter: e.op(e.ext.auth.ProviderConfig.name, 'like', '%oauth%'),
    }
  })

  const providers = await query.run(client)
  if (!providers) {
    throw ErrNotFound
  }

  return providers
})
