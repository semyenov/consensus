import { defineEventHandler, getRouterParams } from 'h3'

import { getIssue } from '#edgedb/queries'
import { ErrNotFound } from '~~/server/errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const params = getRouterParams(req)
  const Issue = getIssue(client, { Issue_id: params.id })

  if (!Issue) {
    throw ErrNotFound
  }

  return Issue
})
