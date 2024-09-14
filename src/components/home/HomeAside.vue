<template>
  <aside class="py-2 text-gray-500 dark:text-gray-400">
    <UCard
      :ui="{ body: { padding: 'p-2', base: 'flex flex-col items-center' }, background: 'bg-white dark:bg-gray-800' }"
    >
      <UAvatar
        src="/me/avatar.jpg"
        class="outline-gray-200 dark:outline-primary outline outline-2 outline-offset-2 mb-2"
        alt="offich"
      />

      <p class="mb-2 text-24">
        offich
      </p>

      <p class="text-15">
        フロントエンド・モバイルアプリエンジニア。Vue.js/Nuxt.js/Flutter が得意です。たまにバックエンドもやります。
      </p>
    </UCard>
  </aside>
</template>
