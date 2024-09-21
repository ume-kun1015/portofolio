<script setup lang="ts">
import { queryContent, useRoute, useAsyncData, navigateTo, computed, definePageMeta, useSeoMeta } from '#imports'
import { withoutTrailingSlash } from 'ufo'

import PostSurround from '~/components/post/PostSurround.vue'
import TableOfPost from '~/components/post/TableOfPost.vue'

definePageMeta({
  layout: 'post',
})

const routePath = computed(() => {
  return `/${withoutTrailingSlash(route.path.replace('/posts/', ''))}`
})

const route = useRoute()
const { data: page } = await useAsyncData(`docs-${route.path}`, () => {
  return queryContent(routePath.value).findOne()
})
if (!page.value) {
  await navigateTo('/')
}

useSeoMeta({
  title: page.value?.title,
  ogTitle: page.value?.title,
  ogType: 'article',
  description: page.value?.description,
  ogDescription: page.value?.description,
  keywords: page.value?.categories.join(', '),
})

const { data: surround } = await useAsyncData(
  `docs-${routePath.value}-surround`,
  () => {
    return queryContent()
      .where({ _extension: 'md', navigation: { $ne: false }, draft: { $not: true } })
      .findSurround(routePath.value)
  },
  { default: () => [] },
)

const hasDatetime = computed(() => {
  return page.value?.publishedAt || page.value?.updatedAt
})

const toPathString = (category: string): string => {
  return category.replace(/\s/g, '').replace(/\./g, '').toLowerCase()
}
</script>

<template>
  <div
    v-if="page"
    class="prose prose-primary dark:prose-invert py-6 px-4 max-w-6xl mx-auto"
  >
    <h1>{{ page.title }}</h1>

    <div class="mb-3">
      <ul
        class="list-none flex not-prose"
        :class="hasDatetime ? 'mb-2 pc:mb-1' : 'mb-0'"
      >
        <li
          v-for="category in page.categories"
          :key="category"
        >
          <ULink
            :to="`/posts/categories/${toPathString(category)}/1`"
            class="mr-1 text-primary border border-primary-500 px-1 py-1/2 rounded-xl block"
          >
            {{ category }}
          </ULink>
        </li>
      </ul>

      <div
        v-if="hasDatetime"
        class="mb-2"
      >
        <span>作成日: {{ page.publishedAt }}</span>

        <template v-if="page.updatedAt">
          <span> / </span>

          <time :datetime="page.updatedAt">
            更新日: {{ page.updatedAt }}
          </time>
        </template>
      </div>
    </div>

    <UDivider class="mb-2" />

    <div
      v-if="page.body"
      class="block pc:flex gap-2"
    >
      <ContentRenderer
        :value="page"
      />

      <div class="hidden pc:block w-1/4">
        <TableOfPost
          v-if="page.body.toc?.links"
          :links="page.body.toc.links"
          class="py-0 pc:py-2"
        />
      </div>
    </div>

    <UDivider
      v-if="surround"
      class="mt-4 mb-6"
    />

    <PostSurround :surround="surround" />
  </div>
</template>

<style scoped>
.prose {
  :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    @apply !bg-gray-800;
  }
}
</style>
