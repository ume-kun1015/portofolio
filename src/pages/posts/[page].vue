<script setup lang="ts">
import { useRoute, computed, queryContent, useAsyncData, definePageMeta } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import PostList from '~/components/post/PostList.vue'
import PostPagination from '~/components/post/PostPagination.vue'
import { per } from '~~/constant/post'

definePageMeta({
  layout: 'post',
})

const route = useRoute()

const page = computed(() => {
  if (Array.isArray(route.params.page)) {
    return 1
  } else {
    return route.params.page ? parseInt(route.params.page, 10) : 1
  }
})

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    skip: (page.value - 1) * per,
    limit: per,
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

const allPagesNum = computed(() => {
  return Math.ceil((allCount.value ?? 0) / per)
})
</script>

<template>
  <div class="p-2 max-w-6xl mx-auto min-h-screen">
    <div class="py-2">
      <PostList :query="query" />
    </div>

    <div
      v-if="allPagesNum > 1"
      class="flex justify-center"
    >
      <PostPagination
        :page="page"
        :per="per"
        :all-count="allCount ?? 0"
        to-page-suffix="/posts"
      />
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
