<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content'
import type { PropType } from 'vue'

defineProps({
  link: {
    type: Object as PropType<ParsedContent>,
    required: true,
  },
  icon: {
    type: String,
    default: undefined,
  },
})
</script>

<template>
  <NuxtLink
    :to="`/posts${link._path}`"
    class="pc:w-1/2 w-full block my-2 px-2 py-2 border not-prose rounded-lg border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 group"
  >
    <div
      v-if="icon || link.icon"
      class="inline-flex items-center rounded-full p-1.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10 ring-1 ring-gray-300 dark:ring-gray-700 mb-2 group-hover:ring-primary/50"
    >
      <UIcon
        :name="icon || link.icon"
        class="w-2 h-2 text-gray-900 dark:text-white group-hover:text-primary"
      />
    </div>

    <p class="font-medium text-gray-900 dark:text-white text-[15px] mb-1">
      {{ link.title }}
    </p>

    <p class="text-sm font-normal text-gray-500 dark:text-gray-400 line-clamp-2">
      {{ link.description }}
    </p>
  </NuxtLink>
</template>
