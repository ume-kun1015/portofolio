<script setup lang="ts">
import AppHeader from '~/components/header/AppHeader.vue'
</script>

<template>
  <div class="bg-white dark:bg-gray-900">
    <NuxtLayout>
      <AppHeader />

      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
