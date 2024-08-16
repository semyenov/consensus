<script setup lang="ts">
const { locale } = useI18n();
const route = useRoute();
</script>

<template>
  <NuxtLayout name="default">
    <NuxtRouteAnnouncer atomic />
    <!-- <NuxtPage :page-key="`${locale}_${route.fullPath}`" :route="route" keepalive /> -->
  </NuxtLayout>
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white h-full;
}
</style>
