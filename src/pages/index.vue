<script setup lang="ts">
import { computed, useSeoMeta } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import HomeAside from '~/components/home/HomeAside.vue'
import PostList from '~/components/post/PostList.vue'

const seoMetaDescription = 'Web フロント・モバイルアプリエンジニア。Nuxt.js と Flutter が得意です。歌とお酒が好きです。'

useSeoMeta({
  description: seoMetaDescription,
  ogDescription: seoMetaDescription,
})

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    sort: [{ publishedAt: -1 }],
    where: [{
      draft: { $not: true },
    }],
    limit: 10,
  }
})
</script>

<template>
  <div class="px-2 py-2 max-w-6xl mx-auto">
    <div class="prose-primary dark:prose-invert block pc:flex gap-0 pc:gap-4">
      <div class="w-full pc:w-3/4">
        <PostList :query="query" />
      </div>

      <div class="w-0 pc:w-1/4 hidden pc:block">
        <HomeAside />
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  @apply text-white;
  max-width: unset;

  :where(code) {
    @apply text-gray-200;
  }

  :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    @apply !bg-gray-800;
  }
}
</style>
