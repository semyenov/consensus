// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'client/',
  serverDir: 'server/',

  // alias: {
  //   '@/components': './client/components',
  //   '@/lib/*': './client/lib/*',
  // },

  compatibilityDate: '2024-08-15',

  typescript: {
    shim: false,
    strict: true,
    typeCheck: true,
  },

  modules: [
    'nuxt-edgedb-module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    'shadcn-nuxt',
  ],

  shadcn: {
    prefix: '',
    componentDir: 'client/components/ui',
  },

  edgeDb: {
    installCli: true,
    projectInit: true,

    // watch: true,
    // watchPrompt: true,

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

  devtools: {
    enabled: true,
  },
})
