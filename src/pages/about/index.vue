<script setup lang="ts">
import { useHead, useSeoMeta } from '#imports'

useHead({
  title: 'About',
})

const seoMetaDescription = '自身について'

useSeoMeta({
  description: seoMetaDescription,
  ogDescription: seoMetaDescription,
  robots: 'noindex',
})
</script>

<template>
  <div class="p-2 max-w-6xl mx-auto min-h-screen">
    <p>coming soon...</p>
  </div>
</template>
