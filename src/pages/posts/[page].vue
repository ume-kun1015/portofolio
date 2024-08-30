<script setup lang="ts">
import { useRoute, computed, queryContent, useAsyncData, useRuntimeConfig } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import PostList from '~/components/post/PostList.vue'

const route = useRoute()

const page = computed(() => {
  if (Array.isArray(route.params.page)) {
    return 1
  } else {
    return route.params.page ? parseInt(route.params.page, 10) : 1
  }
})

const per = computed(() => {
  return useRuntimeConfig().public.post.per
})

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    skip: (page.value - 1) * per.value,
    limit: per.value,
    sort: [{ publishedAt: -1 }],
  }
})

const fetchAllCount = async (): Promise<number> => {
  return queryContent().count()
}

const { data: allCount } = useAsyncData(
  'posts',
  async () => fetchAllCount(),
  {
    watch: [page],
  },
)
</script>

<template>
  <div class="bg-gray-900 prose prose-primary dark:prose-invert">
    <PostList :query="query" />

    <UPagination
      :model-value="page"
      :page-count="per"
      :total="allCount ?? 0"
      :to="(page: number) => ({
        path: `/posts/${page}`,
      })"
    />
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
