<script setup lang="ts">
defineProps<{ category: string }>()
</script>

<template>
  <div>
    <p> {{ category }}</p>
  </div>
</template>
