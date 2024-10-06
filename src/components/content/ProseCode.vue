<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  code: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: undefined,
  },
  language: {
    type: String,
    default: undefined,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  filename: {
    type: String,
    default: undefined,
  },
  highlights: {
    type: Array as PropType<number[]>,
    default: undefined,
  },
  meta: {
    type: String,
    default: undefined,
  },
})
</script>

<template>
  <div class="relative text-gray-700 dark:text-gray-200 text-sm/6 [&>pre]:!rounded-t-none [&>pre]:!my-0 mt-3 mb-5">
    <div
      v-if="filename && !hideHeader"
      class="flex items-center gap-1 border border-gray-200 dark:border-gray-700 border-b-0 relative rounded-t-md px-3 pc:px-2 py-2 not-prose"
    >
      <ProseCodeIcon
        :icon="icon"
        :filename="filename"
      />

      <span class="text-gray-700 dark:text-gray-200 text-sm/6 break-all">{{ filename }}</span>
    </div>

    <ProseCodeButton
      v-if="filename"
      :code="code"
      class="absolute top-2 right-2"
    />
    <slot />
  </div>
</template>

<style>
pre code .line {
  display: block;
  min-height: 1rem;
}
</style>
