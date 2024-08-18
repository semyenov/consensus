<script setup lang="ts">
const { locale } = useI18n()
const route = useRoute()
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
