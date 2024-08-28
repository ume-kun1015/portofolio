<script setup lang="ts">
import { computed } from '#imports'
import type { QueryBuilderParams } from '@nuxt/content'

const links = [
  [
    {
      label: 'Installation',
      icon: 'i-heroicons-home',
      to: '/getting-started/installation',
    },
    {
      label: 'Horizontal Navigation',
      icon: 'i-heroicons-chart-bar',
      to: `/components/horizontal-navigation`,
    },
    {
      label: 'Command Palette',
      icon: 'i-heroicons-command-line',
      to: '/components/command-palette',
    },
  ],
  [
    {
      label: 'Examples',
      icon: 'i-heroicons-light-bulb',
    },
    {
      label: 'Help',
      icon: 'i-heroicons-question-mark-circle',
    },
  ],
]

const query = computed<QueryBuilderParams>(() => {
  return {
    path: '/',
    sort: [{ publishedAt: -1 }],
    limit: 10,
  }
})
</script>

<template>
  <div>
    <UHorizontalNavigation
      :links="links"
      class="border-b border-gray-200 dark:border-gray-800"
    >
      <template #default="{ link }">
        <span class="group-hover:text-primary relative">{{ link.label }}</span>
      </template>
    </UHorizontalNavigation>

    <div class="bg-gray-900 prose prose-primary dark:prose-invert">
      <ContentList :query="query">
        <template #default="{ list: contents }">
          <div
            v-for="content in contents"
            :key="content._path"
          >
            <ULink
              :to="`/posts${content._path}`"
              active-class="text-primary"
              inactive-class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <UCard>
                <p>
                  {{ content.publishedAt }} -  {{ content.title }}
                </p>

                <p>
                  {{ content.description }}
                </p>
              </UCard>
            </ULink>
          </div>
        </template>

        <template #not-found>
          <p>記事が見つかりませんでした</p>
        </template>
      </ContentList>
    </div>
  </div>
</template>

<style scoped>
.prose {
  @apply text-white;
  max-width: unset;

  :where(code) {
    @apply text-gray-200;
  }

  :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    @apply !bg-gray-800;
  }

  @media (min-width: 640px) {
    :where(.prose > :last-child):not(
        :where([class~="not-prose"], [class~="not-prose"] *)
      ) {
      min-width: 450px;
    }
  }
}
</style>
