<script setup lang="ts">
import { useHead } from '#imports'

import AppHeader from '~/components/header/AppHeader.vue'

useHead({
  titleTemplate: (title) => {
    return title ? `${title} | offich.me` : 'offich.me'
  },
})
</script>

<template>
  <div class="bg-white dark:bg-gray-900">
    <NuxtLayout>
      <AppHeader />

      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
