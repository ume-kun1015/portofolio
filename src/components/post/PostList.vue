<script lang="ts" setup>
import type { QueryBuilderParams } from '@nuxt/content'

defineProps<{ query: QueryBuilderParams }>()
</script>

<template>
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
</template>
