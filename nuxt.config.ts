// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'client/',
  serverDir: 'server/',

  compatibilityDate: '2024-08-15',

  typescript: {
    strict: true,
    typeCheck: true,
  },

  modules: [
    'nuxt-edgedb-module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    'shadcn-nuxt',
    '@nuxt/fonts',
  ],

  shadcn: {
    prefix: '',
    componentDir: './client/components/ui',
  },

  edgeDb: {
    installCli: true,
    projectInit: true,

    watch: false,
    watchPrompt: true,

    composables: true,
    injectDbCredentials: true,

    dbschemaDir: 'dbschema',
    queriesDir: 'queries',

    auth: true,
    oauth: true,

    devtools: true,
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ru',
    locales: [
      {
        language: 'en-US',
        name: 'English',
        code: 'en',
      },
      {
        language: 'ru-RU',
        name: 'Русский',
        code: 'ru',
      },
    ],
  },

  experimental: {
    appManifest: true,
    asyncContext: true,
    asyncEntry: true,
    crossOriginPrefetch: true,
    defaults: {
      nuxtLink: {
        trailingSlash: 'remove',
      },
    },
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
})
