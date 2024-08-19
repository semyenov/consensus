export default defineEventHandler(async (req) => {
  const token = getCookie(req, 'edgedb-auth-token')
  if (!token) {
    deleteCookie(req, 'edgedb-auth-token')

    return
  }

  const client = useEdgeDb(req)
  const query = 'select global current_user { ** };'
  try {
    const identity = await client.querySingle(query)

    return identity
  }
  catch {
    setCookie(
      req,
      'edgedb-auth-token',
      '',
      {
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: true,
        expires: /* @__PURE__ */ new Date(0),
      },
    )

    return null
  }
})
