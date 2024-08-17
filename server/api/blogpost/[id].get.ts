import { defineEventHandler, getRouterParams } from 'h3'

import { getBlogpost } from '#edgedb/queries'
import { ErrNotFound } from '~~/server/errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const params = getRouterParams(req)
  const blogpost = getBlogpost(client, { blogpost_id: params.id })

  if (!blogpost) {
    throw ErrNotFound
  }

  return blogpost
})
