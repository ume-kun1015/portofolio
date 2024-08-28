<script setup lang="ts">
import { queryContent, useRoute, useAsyncData } from '#imports'

import TableOfContent from '~/components/TableOfContent.vue'

const route = useRoute()
const { data: page, status } = await useAsyncData(`docs-${route.path}`, () =>
  queryContent(route.path.replace('/posts/', '')).findOne(),
)
</script>

<template>
  <div>
    <USkeleton
      v-if="['idle', 'pending'].includes(status)"
      class="h-4"
    />

    <div
      v-if="page?.body"
      class="bg-gray-900 prose prose-primary dark:prose-invert p-4 flex"
    >
      <ContentRenderer
        v-if="page.body"
        :value="page"
      />

      <div>
        <TableOfContent
          v-if="page.body.toc?.links"
          :links="page.body.toc.links"
        />
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

  @media (min-width: 640px) {
    :where(.prose > :last-child):not(
        :where([class~="not-prose"], [class~="not-prose"] *)
      ) {
      min-width: 450px;
    }
  }
}
</style>
