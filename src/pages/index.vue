<script setup lang="ts">
import { computed } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import PostList from '~/components/post/PostList.vue'
import AppAside from '~/components/aside/AppAside.vue'

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    sort: [{ publishedAt: -1 }],
    limit: 10,
  }
})
</script>

<template>
  <div class="bg-gray-900 px-2">
    <div class="prose-primary dark:prose-invert py-2 flex">
      <div>
        <PostList :query="query" />
      </div>

      <AppAside />
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
