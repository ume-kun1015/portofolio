<script setup lang="ts">
import { computed, useColorMode } from '#imports'

const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  },
})
</script>

<template>
  <!-- SSG mode なので、開発時に server と client の両方レンダリングされる。 -->
  <!-- color mode が server で system 、 client で dark となり、 hydration mismatch になることから、 ClientOnly でラップしている  -->
  <ClientOnly>
    <UToggle
      :model-value="isDark"
      on-icon="i-heroicons-moon-20-solid"
      off-icon="i-heroicons-sun-20-solid"
      size="xs"
      :ui="{ container: { active: { xs: 'translate-x-3 rtl:-translate-x-3' } } }"
      :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
      :disabled="colorMode.forced"
      @update:model-value="isDark = !isDark"
    />
  </ClientOnly>
</template>
