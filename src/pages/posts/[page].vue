<script setup lang="ts">
import { useRoute, computed, queryContent, useAsyncData, useRuntimeConfig } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

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
    where: [{
      draft: { $not: true },
    }],
  }
})

const fetchAllCount = async (): Promise<number> => {
  return queryContent().where(
    {
      draft: { $not: true },
    },
  ).count()
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
    <ContentList :query="query">
      <template #default="{ list: contents }">
        <div
          v-for="content in contents"
          :key="content._path"
        >
          <ULink
            :to="`/posts${content._path}`"
            active-class="text-primary"
            inactive-class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <p>
              {{ content.publishedAt }} - {{ content.title }}
            </p>

            <p>
              {{ content.description }}
            </p>
          </ULink>
        </div>
      </template>

      <template #not-found>
        <p>記事が見つかりませんでした</p>
      </template>
    </ContentList>

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

  @media (min-width: 640px) {
    :where(.prose > :last-child):not(
        :where([class~="not-prose"], [class~="not-prose"] *)
      ) {
      min-width: 450px;
    }
  }
}
</style>
