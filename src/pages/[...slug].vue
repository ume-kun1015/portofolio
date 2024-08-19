<script setup>
import { queryContent } from "#imports";

const filtered = await queryContent()
  .where({ category: { $contains: ["flutter", "tech"] } })
  .find();

console.log({ filtered });

const all = await queryContent().count();
console.log({ all });
</script>

<template>
  <main class="bg-gray-900 prose prose-primary dark:prose-invert">
    <!-- ContentDoc を使う時は、 DO NOT MOVE -->
    <!-- <ContentDoc /> -->
  </main>
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
