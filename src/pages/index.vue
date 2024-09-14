<script setup lang="ts">
import { computed } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import PostList from '~/components/post/PostList.vue'

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    sort: [{ publishedAt: -1 }],
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
