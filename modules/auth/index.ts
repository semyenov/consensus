import { defineNuxtModule, addComponentsDir, createResolver   } from '@nuxt/kit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

export interface ModuleOptions {
  // Define any options your module might accept
  componentPrefix?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'authModule',
    configKey: 'authModule',
  },
  defaults: {
    componentPrefix: ''
  },
  setup(options, nuxt) {
    // const {resolve} = createResolver( import.meta.url)
    // const runtimeDir = resolve('./runtime')
    // const componentsDir = join(runtimeDir, 'components')
    // addComponentsDir({
    //   path: componentsDir,
    //   global: true,
    // })
  }
})
