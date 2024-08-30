<template>
  <ul class="sticky top-8">
    <li
      v-for="link in links"
      :key="link.text"
      :class="['space-y-1', link.depth === 3 && 'ml-3']"
    >
      <NuxtLink
        :to="`#${link.id}`"
        :class="['block text-sm/6 truncate no-underline hover:no-underline', activeHeadings.includes(link.id) ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200']"
        @click.prevent="scrollToHeading(link.id)"
      >
        {{ link.text }}
      </NuxtLink>

      <TableOfPost
        v-if="link.children"
        :links="link.children"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useRouter, useNuxtApp, useScrollspy } from '#imports'
import type { TocLink } from '@nuxt/content'

defineProps<{ links: TocLink[] }>()

const emit = defineEmits(['move'])

const router = useRouter()
const nuxtApp = useNuxtApp()
const { activeHeadings, updateHeadings } = useScrollspy()

nuxtApp.hooks.hookOnce('page:finish', () => {
  updateHeadings([
    ...document.querySelectorAll('h2'),
    ...document.querySelectorAll('h3'),
  ])
})

const scrollToHeading = (id: string) => {
  const encodedId = encodeURIComponent(id)
  router.push(`#${encodedId}`)
  emit('move', id)
}
</script>
