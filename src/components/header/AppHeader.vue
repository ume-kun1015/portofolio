<script setup lang="ts">
import { useMatchMediaListener, onMounted, ref } from '#imports'

import ColorModeToggle from '~/components/header/ColorModeToggle.vue'

const isMobile = ref(false)
onMounted(() => {
  const toggleIsMobile = (mql: MediaQueryList | MediaQueryListEvent): void => {
    isMobile.value = !mql.matches
  }
  const { setMatchMediaHandler } = useMatchMediaListener()
  setMatchMediaHandler(toggleIsMobile)
})
</script>

<template>
  <header class="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50 h-8 p-2">
    <UContainer class="flex items-center justify-between gap-3 h-[--header-height] px-2">
      <div class="lg:flex-1 flex items-center gap-1.5">
        <NuxtLink
          to="/"
          class="flex-shrink-0 font-bold text-xl text-gray-900 dark:text-white flex items-end gap-1.5"
        >
          offich.me
        </NuxtLink>
      </div>

      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <UButton
          icon="i-heroicons-user-circle"
          to="/about"
          color="gray"
          variant="ghost"
          class="p-0.5"
          size="2xs"
          :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        >
          {{ isMobile ? '' : 'About' }}
        </UButton>

        <UButton
          icon="i-heroicons-musical-note"
          to="/music"
          color="gray"
          variant="ghost"
          class="p-0.5"
          size="2xs"
          :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        >
          {{ isMobile ? '' : 'Music' }}
        </UButton>

        <UButton
          icon="i-heroicons-funnel"
          to="/bartender"
          color="gray"
          variant="ghost"
          class="p-0.5"
          size="2xs"
          :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        >
          {{ isMobile ? '' : 'Bartender' }}
        </UButton>

        <UButton
          icon="i-heroicons-document"
          to="/posts/1"
          color="gray"
          variant="ghost"
          class="p-0.5"
          size="2xs"
          :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        >
          {{ isMobile ? '' : 'Posts' }}
        </UButton>

        <div class="w-6 h-3">
          <ColorModeToggle />
        </div>
      </div>
    </UContainer>
  </header>
</template>
