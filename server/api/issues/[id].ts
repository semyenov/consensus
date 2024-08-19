import { defineEventHandler, getRouterParams, readBody } from 'h3'

import { ErrBadRequest, ErrNoParamId, ErrNotFound } from '../../errors'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb(req)
  const params = getRouterParams(req)
  const e = useEdgeDbQueryBuilder()

  if (req.method === 'GET') {
    if (!params.id) {
      throw ErrNoParamId
    }

    const e = useEdgeDbQueryBuilder()
    const query = e.select(e.issue.Issue, () => ({
      ...e.issue.Issue['*'],
      filter_single: e.op(e.issue.Issue.id, '=', params.id),
    }))

    const issue = await query.run(client)
    if (!issue) {
      throw ErrNotFound
    }

    return issue
  }

  if (req.method === 'PUT') {
    if (!params.id) {
      throw ErrNoParamId
    }

    const body = await readBody(req)
    if (!body) {
      throw ErrBadRequest
    }

    const query = e.update(e.issue.Issue, () => ({
      set: body,
      filter_single: e.op(e.issue.Issue.id, '=', params.id),
    }))

    return query.run(client)
  }

  if (req.method === 'DELETE') {
    if (!params.id) {
      throw ErrNoParamId
    }

    const query = e.delete(e.issue.Issue, () => ({
      filter_single: e.op(e.issue.Issue.id, '=', params.id),
    }))

    return query.run(client)
  }
})
