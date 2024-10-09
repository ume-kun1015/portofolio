<script lang="ts" setup>
import { computed } from '#imports'

type Alert = 'note' | 'tip' | 'important' | 'warning' | 'caution'
type NoteColor = 'primary' | 'green' | 'purple' | 'yellow' | 'red'

const props = withDefaults(
  defineProps<{ type?: Alert }>(),
  { type: 'note' },
)

const color = computed<NoteColor>(() => {
  if (props.type === 'note') {
    return 'primary'
  }

  if (props.type === 'tip') {
    return 'green'
  }

  if (props.type === 'important') {
    return 'purple'
  }

  if (props.type === 'warning') {
    return 'yellow'
  }

  if (props.type === 'caution') {
    return 'red'
  }

  return 'primary'
})
</script>

<template>
  <UAlert
    variant="soft"
    :color="color"
    :ui="{ padding: 'px-2 py-0 my-1' }"
  >
    <template #description>
      <slot />
    </template>
  </UAlert>
</template>
