// https://nuxt.com/docs/api/configuration/nuxt-config
import { join, resolve } from 'pathe'

// src dir
const rootDir = resolve(__dirname)

const clientDir = join(rootDir, 'client')
const serverDir = join(rootDir, 'server')

export default defineNuxtConfig({
  compatibilityDate: '2024-08-15',

  rootDir,
  serverDir,
  srcDir: clientDir,

  dir: {
    public: join(rootDir, 'public'),

    app: join(clientDir, 'app'),
    assets: join(clientDir, 'assets'),
    layouts: join(clientDir, 'layouts'),
    modules: join(clientDir, 'modules'),
    pages: join(clientDir, 'pages'),
    middleware: join(clientDir, 'middleware'),
    plugins: join(clientDir, 'plugins'),
  },

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
    '@nuxt/content',
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
    identityModel: 'user::User',

    dbschemaDir: join(rootDir, 'dbschema'),
    queriesDir: join(rootDir, 'queries'),

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
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
})
