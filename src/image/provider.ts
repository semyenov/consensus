import { joinURL } from 'ufo'

import type { ProviderGetImage } from '@nuxt/image'

export const getImage: ProviderGetImage = (src, options) => {
  let { baseURL } = options

  if (!baseURL) {
    baseURL = 'https://avatars.githubusercontent.com/u/'
  }

  return {
    format: 'webp',
    url: joinURL(baseURL, src),
  }
}

export const validateDomains = true
export const supportsAlias = true
