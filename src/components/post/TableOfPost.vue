<script lang="ts" setup>
import type { Toc } from '@nuxt/content'

defineProps<{ toc: Toc }>()
</script>

<template>
  <ul>
    <li
      v-for="link in toc.links"
      :key="link.text"
    >
      <a :href="`#${link.id}`">
        {{ link.text }}
      </a>
    </li>
  </ul>
</template>
