import { joinURL } from 'ufo'

import type { ProviderGetImage } from '@nuxt/image'

import { createOperationsGenerator } from '#image'

export const validateDomains = true
export const supportsAlias = true

const operationsGenerator = createOperationsGenerator()
export const getImage: ProviderGetImage = (
  src,
  {
    modifiers = {},
    baseURL = 'https://avatars.githubusercontent.com/u/',
  },
) => {
  const operations = operationsGenerator(modifiers)

  return {
    url: joinURL(baseURL, src + (operations ? `?${operations}` : '')),
  }
}
