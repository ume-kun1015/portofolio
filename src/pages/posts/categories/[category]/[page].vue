<script setup lang="ts">
import { useRoute, computed, queryContent, useAsyncData, useRuntimeConfig, definePageMeta } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import PostList from '~/components/post/PostList.vue'
import PostPagination from '~/components/post/PostPagination.vue'
import { urlParamsCategoryMap } from '~~/constant/post'

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

const cateogryParams = computed<string>(() => {
  const category = route.params.category
  if (Array.isArray(category)) {
    return ''
  }

  const found = urlParamsCategoryMap[category]
  if (found) {
    return found
  }

  return `${category.charAt(0).toUpperCase()}${category.slice(1)}` // capitalize
})

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    skip: (page.value - 1) * per.value,
    limit: per.value,
    sort: [{ publishedAt: -1 }],
    where: [
      {
        categories: { $contains: cateogryParams.value },
      },
    ],
  }
})

const fetchAllCountByCategories = async (): Promise<number> => {
  return queryContent()
    .where({
      categories: { $contains: cateogryParams.value },
    })
    .count()
}

const { data: allCount } = useAsyncData(
  'posts',
  async () => fetchAllCountByCategories(),
  {
    watch: [page],
  },
)

const allPagesNum = computed(() => {
  return Math.ceil((allCount.value ?? 0) / per)
})
</script>

<template>
  <div class="p-2 max-w-6xl mx-auto h-screen">
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
        :to-page-suffix="`/posts/categories/${route.params.category}`"
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

  @media (min-width: 640px) {
    :where(.prose > :last-child):not(
        :where([class~="not-prose"], [class~="not-prose"] *)
      ) {
      min-width: 450px;
    }
  }
}
</style>
