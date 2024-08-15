import { defineEventHandler, getRouterParams } from 'h3'

import { getBlogpost } from '#edgedb/queries'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const params = getRouterParams(req)

  const blogpost = getBlogpost(client, { id: params.id })
  if (!blogpost) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Blogpost not found',
    })
  }

  return blogpost
})
