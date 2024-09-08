<template>
  <div class="gap-4 sm:grid-cols-2 pc:flex block">
    <PostSurroundLink
      v-if="previous"
      :link="previous"
      icon="i-heroicons-arrow-left-20-solid"
    />

    <span
      v-else
      class="w-1/2"
    >
      &nbsp;
    </span>

    <PostSurroundLink
      v-if="next"
      :link="next"
      icon="i-heroicons-arrow-right-20-solid"
      class="text-right"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from '#imports'
import type { ParsedContent } from '@nuxt/content'
import type { PropType } from 'vue'

import PostSurroundLink from '~/components/post/PostSurroundLink.vue'

const props = defineProps({
  surround: {
    type: Array as PropType<ParsedContent[]>,
    required: true,
  },
})

const previous = computed<ParsedContent>(() => {
  return props.surround[0]
})

const next = computed<ParsedContent>(() => {
  return props.surround[1]
})
</script>
