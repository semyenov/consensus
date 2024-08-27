<script setup lang="ts">
import { NuxtRouteAnnouncer } from '#components'

const route = useRoute()
</script>

<template>
  <NuxtRouteAnnouncer :route="route">
    <template #default="{ message }">
      <p>{{ message }} was loaded.</p>
    </template>
  </NuxtRouteAnnouncer>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
