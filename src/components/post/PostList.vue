<script lang="ts" setup>
import type { QueryBuilderParams } from '@nuxt/content'

defineProps<{ query: QueryBuilderParams }>()

const toPathString = (category: string): string => {
  return category.replace(/\s/g, '').replace(/\./g, '').toLowerCase()
}
</script>

<template>
  <ContentList :query="query">
    <template #default="{ list: contents }">
      <div
        v-for="content in contents"
        :key="content._path"
        class="my-2 min-h-10 box-border"
      >
        <UCard
          class="p-0"
          :ui="{ body: { padding: 'p-2' }, background: 'bg-white dark:bg-gray-800' }"
        >
          <ULink
            :to="`/posts${content._path}`"
            class="block"
            active-class="text-primary"
            inactive-class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2 inline-block"
          >
            <p>
              {{ content.title }}
            </p>
          </ULink>

          <div class="flex justify-between mb-3 pc:mb-0">
            <ul class="list-none flex not-prose">
              <li
                v-for="category in content.categories"
                :key="category"
              >
                <ULink
                  :to="`/posts/categories/${toPathString(category)}/1`"
                  class="mr-1 text-primary border border-primary-500 px-1 py-1/2 rounded-xl block hover:text-primary-800 hover:border-primary-800 dark:hover:text-primary-300 dark:hover:border-primary-300"
                >
                  {{ category }}
                </ULink>
              </li>
            </ul>

            <p class="text-gray-400">
              {{ content.publishedAt }}
            </p>
          </div>
        </UCard>
      </div>
    </template>

    <template #not-found>
      <p>記事が見つかりませんでした</p>
    </template>
  </ContentList>
</template>
