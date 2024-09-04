import { useRuntimeConfig } from '#imports'

export function useEdgeDbEnv() {
  const { edgeDb } = useRuntimeConfig()
  console.log('edgeDb', edgeDb)
  return edgeDb
}
