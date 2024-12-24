import { H3Error, defineEventHandler, readBody, sendError, setHeaders, createError, setCookie } from 'h3'
import { useNitroApp } from '#imports'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'
import { useEdgeDb } from '../../server/composables/useEdgeDb'
import { useEdgeDbPKCE } from '../../server/composables/useEdgeDbPKCE'
import { useEdgeDbQueryBuilder } from '../../server/composables/useEdgeDbQueryBuilder'
import identity from './identity'

/**
 * Handles sign up with email and password.
 *
 * @param {Request} req
 * @param {Response} res
 */
export default defineEventHandler(async (req) => {
  const pkce = useEdgeDbPKCE()
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl, verifyRedirectUrl } = urls

  const { email, password, provider, ...userData } = await readBody(req)

  if (!email || !password || !provider) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      data: {
        message: `Request body malformed. Expected JSON body with 'email', 'password', and 'provider' keys, but got: ${Object.entries({ email, password, provider }).filter(([, v]) => !!v)}`,
      },
    })
    return sendError(req, err)
  }

  const registerUrl = new URL('register', authBaseUrl)
  const registerResponse = await fetch(registerUrl.href, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challenge: pkce.challenge,
      email,
      provider,
      password,
      verify_url: verifyRedirectUrl,
    }),
  })

  if (!registerResponse.ok) {
    const err = createError({
      statusCode: 400,
      statusMessage: `Bad request`,
      data: {
        message: `${await registerResponse.text()}`,
      },
    })
    return sendError(req, err)
  }

  const registerResponseData = await registerResponse.json()


  const tokenUrl = new URL('token', authBaseUrl)
  tokenUrl.searchParams.set('code', registerResponseData.code)
  tokenUrl.searchParams.set('verifier', pkce.verifier)
  const tokenResponse = await fetch(tokenUrl.href, {
    method: 'get',
  })

  if (!tokenResponse.ok) {
    const err = createError({
      statusCode: 400,
      statusMessage: `${await tokenResponse.text()}`,
    })
    return sendError(req, err)
  }

  const tokenResponseData = await tokenResponse.json()


  console.log('register tokenResponseData', tokenResponseData)
  await useNitroApp().hooks.callHook(
    'edgedb:auth:signup',
    {
      tokenResponseData,
      userData: {
        ...userData,
        email,
      },
    },
  )

  setCookie(req, 'edgedb-pkce-verifier', pkce.verifier, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: true,
  })

  setCookie(req, 'edgedb-auth-token', tokenResponseData.auth_token, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: true,
  })


  return registerResponseData
})
