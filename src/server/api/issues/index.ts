import { defineEventHandler, readBody } from 'h3'

import { ErrBadRequest } from '../../errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const e = useEdgeDbQueryBuilder()

  if (req.method === 'GET') {
    const query = e.select(e.issue.Issue, () => ({
      ...e.issue.Issue['*'],
    }))

    return query.run(client)
  }

  if (req.method === 'POST') {
    const body: any = await readBody(req)
    if (!body) {
      throw ErrBadRequest
    }

    const query = e.insert(e.issue.Issue, body)

    return query.run(client)
  }

  throw ErrBadRequest // Handle unsupported methods
})
