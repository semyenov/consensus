import { allProviders } from '#edgedb/queries'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)

  return allProviders(client)
})
