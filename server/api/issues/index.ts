import { defineEventHandler, readBody } from 'h3'

import { ErrBadRequest } from '../../errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const e = useEdgeDbQueryBuilder()

  if (req.method === 'POST') {
    const body: any = await readBody(req)
    if (!body) {
      throw ErrBadRequest
    }

    const query = e.insert(e.issue.Issue, body)

    return query.run(client)
  }

  if (req.method === 'GET') {
    const query = e.select(e.issue.Issue, () => {
      return {
        ...e.issue.Issue['*'],
      }
    })

    const issues = await query.run(client)

    return issues
  }

  throw ErrBadRequest // Handle unsupported methods
})
