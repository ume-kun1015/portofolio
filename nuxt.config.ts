import { defineNuxtConfig } from 'nuxt/config'

import { getContentRoutes } from './utils/config/nitro/getContentRoutes'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'ja',
      },
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, user-scalable=no',
        },
      ],
    },
  },

  nitro: {
    preset: 'cloudflare-pages',

    prerender: {
      routes: getContentRoutes(),
    },
  },

  imports: {
    autoImport: false,
  },

  components: {
    dirs: [],
  },

  modules: ['@nuxt/content', '@nuxt/ui', '@nuxt/image', '@nuxt/eslint'],

  eslint: {
    config: {
      stylistic: {
        indent: 2,
        arrowParens: true,
        quotes: 'single',
        semi: false,
        braceStyle: '1tbs',
        commaDangle: 'always-multiline',
        quoteProps: 'as-needed',
      },
    },
  },

  routeRules: {
    '/': { prerender: true },
  },

  srcDir: 'src', // プロジェクト全体の設定ファイルと nuxt 関連のファイルを混ぜないようにするため

  ui: {
    global: true,
  },

  content: {
    markdown: {
      rehypePlugins: [
        [
          'rehype-external-links', {
            target: '_blank',
            rel: 'nofollow noopener noreferrer',
          },
        ],
      ],
    },

    highlight: {
      theme: {
        default: 'material-theme',
      },

      langs: [
        'json',
        'js',
        'ts',
        'html',
        'css',
        'vue',
        'shell',
        'mdc',
        'md',
        'yaml',
        'dart',
        'xml',
        'csv',
        'ruby',
        'go',
        'diff',
        'docker',
        'dotenv',
        'python',
        'scss',
      ],
    },
  },

  compatibilityDate: '2024-08-08',
})
