<script lang="ts" setup>
import { computed, useRouter } from '#imports'

const props = defineProps<{ page: number, per: number, allCount: number, toPageSuffix: string }>()

const to = (page: number): string => {
  return `${props.toPageSuffix}/${page}`
}

const router = useRouter()
const navigate = (page: number): void => {
  router.push(to(page))
}

const canGoFirstOrPrev = computed(() => props.page > 1)
const canGoLastOrNext = computed(() => props.page < Math.ceil(props.allCount / props.per))
</script>

<template>
  <UPagination
    size="2xs"
    :ui="{ base: 'rounded-md' }"
    :model-value="page"
    :page-count="per"
    :total="allCount ?? 0"
    :to="to"
    @update:model-value="navigate"
  >
    <template #prev="{ onClick }">
      <UButton
        icon="i-heroicons-arrow-small-left-20-solid"
        color="white"
        class="rtl:[&_span:first-child]:rotate-180"
        size="2xs"
        :disabled="!canGoFirstOrPrev"
        :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        @click="onClick"
      />
    </template>

    <template #next="{ onClick }">
      <UButton
        icon="i-heroicons-arrow-small-right-20-solid"
        color="white"
        class="rtl:[&_span:last-child]:rotate-180"
        :disabled="!canGoLastOrNext"
        size="2xs"
        :ui="{ icon: { size: { '2xs': 'w-3 h-3' } } }"
        @click="onClick"
      />
    </template>
  </UPagination>
</template>
