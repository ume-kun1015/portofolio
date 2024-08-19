<script setup lang="ts">
import TableOfContent from "~/components/TableOfContent.vue";
import { queryContent, useRoute, useAsyncData } from "#imports";

const route = useRoute();
console.log(route.path);
const { data: page } = await useAsyncData(`docs-${route.path}`, () =>
  queryContent(route.path.replace("/blogs/", "")).findOne()
);
</script>

<template>
  <USkeleton class="h-4" />

  <div v-if="page" class="bg-gray-900 prose prose-primary dark:prose-invert">
    <template v-if="page.body">
      <TableOfContent v-if="page.body.toc" :toc="page.body.toc" />
      <ContentRenderer v-if="page.body" :value="page" />
    </template>
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
