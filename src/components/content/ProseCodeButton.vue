<script setup lang="ts">
import { useCopyToClipboard, ref } from '#imports'

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
})

const clipboard = useCopyToClipboard({ timeout: 2000 })
const icon = ref('i-heroicons-clipboard-document')

const copy = (): void => {
  clipboard.copy(props.code, { title: 'コピーしました' })

  icon.value = 'i-heroicons-clipboard-document-check'

  setTimeout(() => {
    icon.value = 'i-heroicons-clipboard-document'
  }, 2000)
}
</script>

<template>
  <UIcon
    :name="icon"
    :size="24"
    aria-label="Copy code to clipboard"
    class="p-0.5"
    @click="copy"
  />
</template>
