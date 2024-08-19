import { joinURL } from 'ufo'

import type { ProviderGetImage } from '@nuxt/image'

import { createOperationsGenerator } from '#image'

const operationsGenerator = createOperationsGenerator()

export const getImage: ProviderGetImage = (src, options) => {
  let { baseURL, modifiers } = options
  const operations = operationsGenerator(modifiers)

  if (!baseURL) {
    baseURL = 'https://avatars.githubusercontent.com/u/'
  }

  return {
    url: joinURL(baseURL, src + (operations ? `?${operations}` : '')),
  }
}

export const validateDomains = true
export const supportsAlias = true
