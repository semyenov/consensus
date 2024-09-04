import { createClient } from 'edgedb'
import { defineNitroPlugin } from '#imports'
import { useEdgeDbEnv } from '../composables/useEdgeDbEnv'

export default defineNitroPlugin(() => {
  const { dsn } = useEdgeDbEnv()

  const client = createClient({
    dsn: dsn.full,
    tlsSecurity: dsn.tlsSecurity,
    tlsCA: dsn.tlsCA,
  })

  globalThis.__nuxt_edgedb_client__ = client
})
