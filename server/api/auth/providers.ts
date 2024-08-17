import { ErrNotFound } from '../../errors'

import { allProviders } from '#edgedb/queries'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)

  const providers = await allProviders(client)
  if (!providers) {
    throw ErrNotFound
  }

  return providers
})
