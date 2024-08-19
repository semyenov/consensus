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
  <NuxtLayout>
    <NuxtPage :key="locale + route.path" :page-key="route.path" />
  </NuxtLayout>
</template>
