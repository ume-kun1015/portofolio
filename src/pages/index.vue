<script setup lang="ts">
import { computed } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

import AppAside from '~/components/aside/AppAside.vue'
import AppHeader from '~/components/header/AppHeader.vue'

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
    <AppHeader />

    <div class="prose-primary dark:prose-invert py-2 flex">
      <div>
        <ContentList :query="query">
          <template #default="{ list: contents }">
            <div
              v-for="content in contents"
              :key="content._path"
              class="my-2 min-h-10 box-border"
            >
              <ULink
                :to="`/posts${content._path}`"
                class="block"
                active-class="text-primary"
                inactive-class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <UCard
                  class="p-0"
                  :ui="{ body: { padding: 'p-2' } }"
                >
                  <p>
                    {{ content.publishedAt }} -  {{ content.title }}
                  </p>

                  <p>
                    {{ content.description }}
                  </p>
                </UCard>
              </ULink>
            </div>
          </template>

          <template #not-found>
            <p>記事が見つかりませんでした</p>
          </template>
        </ContentList>
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

  @media (min-width: 640px) {
    :where(.prose > :last-child):not(
        :where([class~="not-prose"], [class~="not-prose"] *)
      ) {
      min-width: 450px;
    }
  }
}
</style>
