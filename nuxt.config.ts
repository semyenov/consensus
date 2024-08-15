// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src',
  compatibilityDate: '2024-08-15',

  modules: [
    '@nuxtjs/i18n',
    'nuxt-edgedb-module',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    'shadcn-nuxt',
  ],

  shadcn: {
    prefix: '',
    componentDir: 'src/components/ui',
  },

  edgeDb: {
    installCli: true,
    projectInit: true,
    dbschemaDir: 'dbschema',
    queriesDir: 'queries',

    auth: true,
    oauth: true,
    composables: true,
    identityModel: 'User',
    injectDbCredentials: true,

    watch: true,
    watchPrompt: true,
    devtools: true,
  },

  i18n: {
    defaultLocale: 'ru',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
      },
      {
        code: 'ru',
        iso: 'ru-RU',
        name: 'Русский',
      },
    ],
  },

  devtools: {
    enabled: true,
  },
})
