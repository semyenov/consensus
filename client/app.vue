<script setup lang="ts">
const { locale } = useI18n();
const route = useRoute();
</script>

<template>
  <NuxtRouteAnnouncer>
    <template #default="{ message }">
      <p>{{ message }} was loaded.</p>
    </template>
  </NuxtRouteAnnouncer>
  <Suspense :key="locale + route.path">
    <NuxtLayout name="default">
      <NuxtPage :key="locale" :page-key="route.path" />
    </NuxtLayout>
  </Suspense>
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white h-full;
}
</style>
