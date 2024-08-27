// https://nuxt.com/docs/api/configuration/nuxt-config
import { join, relative, resolve } from 'pathe'

// src dir
const rootDir = resolve(__dirname)

const clientDir = join(rootDir, 'client')
const serverDir = join(rootDir, 'server')

export default defineNuxtConfig({
  compatibilityDate: '2024-08-15',

  rootDir,
  serverDir,
  srcDir: clientDir,

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
  },

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
    shim: true,
    // typeCheck: true,
  },

  nitro: {
    rootDir,

    // database: {
    //   default: {
    //     connector: 'sqlite',
    //     options: {
    //       filename: join(rootDir, '.data', 'nuxt', 'db.sqlite'),
    //     },
    //   },
    // },
    // storage: {
    //   fs: {
    //     driver: 'fs',
    //     base: join(rootDir, '.data', 'nuxt'),
    //   },
    //   redis: {
    //     driver: 'redis',
    //     options: {
    //       host: 'localhost',
    //       port: 6379,
    //       db: 0,
    //     },
    //   },
    // },
    // compressPublicAssets: {
    //   brotli: true,
    // },
    // prerender: {
    //   routes: [
    //     '/',
    //     '/404',
    //     '/auth/login',
    //     '/auth/logout',
    //     '/auth/register',
    //     '/auth/reset-password',
    //   ],
    // },
    rollupConfig: undefined,
    runtimeConfig: {
      ipx: {
        fs: { dir: join(rootDir, '.data', 'nuxt', 'ipx') },
        alias: { '/avatars': 'avatars.githubusercontent.com' },
      },
    },
    scheduledTasks: {
      '*/2 * * * *': 'edgedb:generate',
    },
    experimental: {
      wasm: true,
      tasks: true,
      database: true,
      websocket: true,
      asyncContext: true,
      typescriptBundlerResolution: true,
    },
    wasm: {
      esmImport: true,
      lazy: true,
    },
    logging: {
      buildSuccess: true,
      compressedSizes: true,
    },
    timing: true,
    debug: true,
  },

  modules: [
    '@nuxtjs/partytown',
    '@nuxtjs/tailwindcss',
    'nuxt-content-assets',
    '@nuxtjs/mdc',
    'nuxt-content-twoslash',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    'shadcn-nuxt',
    '@nuxt/fonts',
    '@nuxt/content',
    'nuxt-edgedb-module',
    '@nuxt/image',
    'nuxt-echarts',
  ],

  content: {
    locales: ['ru', 'en'],
    sources: [join(rootDir, 'content')],
    navigation: {
      fields: ['title', 'description', 'image', 'tags', 'slug'],
    },
    experimental: {
      clientDB: true,
    },
  },

  shadcn: {
    prefix: '',
    componentDir: join(clientDir, 'components', 'ui'),
  },

  edgeDb: {
    installCli: true,
    projectInit: true,

    watch: false,
    watchPrompt: true,

    composables: true,
    injectDbCredentials: true,

    dbschemaDir: join(rootDir, 'dbschema'),
    queriesDir: join(rootDir, 'queries'),

    auth: true,
    oauth: true,

    devtools: true,
  },

  image: {
    provider: 'avatars',
    avatars: {
      domains: ['avatars.githubusercontent.com'],
      alias: { avatars: 'https://avatars.githubusercontent.com/u/' },
      dir: join(clientDir, 'assets', 'images'),
    },

    providers: {
      avatars: {
        name: 'avatars',
        provider: 'image/provider',
        options: {
          baseURL: 'https://avatars.githubusercontent.com/u/',
          presets: {
            avatar: {
              modifiers: {
                width: 128,
                height: 128,
                fit: 'cover',
              },
            },
            profile: {
              modifiers: {
                width: 256,
                height: 256,
                fit: 'cover',
              },
            },
          },
        },
      },
    },
  },

  i18n: {
    lazy: true,
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    customRoutes: 'config',
    routesNameSeparator: '___',

    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
      cookieKey: 'consensus-language',
      cookieCrossOrigin: true,
    },

    langDir: relative(clientDir, 'languages'),

    bundle: {
      fullInstall: true,
      runtimeOnly: false,
      dropMessageCompiler: false,
    },

    locales: [
      {
        name: 'English',
        language: 'en-US',
        file: 'en.yml',
        code: 'en',
      },
      {
        name: 'Русский',
        language: 'ru-RU',
        file: 'ru.yml',
        code: 'ru',
      },
    ],
  },

  experimental: {
    headNext: true,
    asyncEntry: true,
    typedPages: false,
    appManifest: true,
    externalVue: true,
    restoreState: true,
    scanPageMeta: true,
    asyncContext: true,
    viewTransition: false,
    writeEarlyHints: true,
    payloadExtraction: true,
    sharedPrerenderData: true,
    crossOriginPrefetch: true,
  },

  devtools: {
    enabled: true,
  },
})
