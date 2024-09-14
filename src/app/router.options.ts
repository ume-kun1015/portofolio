import { useNuxtApp } from '#imports'
import type { RouterConfig } from '@nuxt/schema'

import { findHashPosition } from '~/utils/router/hashPosition'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()

    if (savedPosition) {
      return new Promise((resolve) => {
        nuxtApp.hooks.hookOnce('page:finish', () => {
          setTimeout(() => resolve(savedPosition), 50)
        })
      })
    }

    if (to.hash) {
      return new Promise((resolve) => {
        // 投稿された記事の見出しをクリックしたときにスクロールが発生するようにする
        if (to.path === from.path) {
          setTimeout(() => resolve(findHashPosition(to.hash)), 50)
        } else {
          nuxtApp.hooks.hookOnce('page:finish', () => {
            setTimeout(() => resolve(findHashPosition(to.hash)), 50)
          })
        }
      })
    }

    return { top: 0 }
  },
}
