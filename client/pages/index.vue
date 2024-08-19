<script setup lang="ts">
import { clone } from 'remeda'

const config = useRuntimeConfig()

const edgeDb = clone(config.edgeDb)
const user = useEdgeDbIdentity()

console.log(edgeDb)
console.log(user)
</script>

<template>
  <Avatar class="w-32 h-32 shadow-lg shadow-black/30" shape="circle">
    <AvatarImage src="https://avatars.githubusercontent.com/u/5471452?v=4" :alt="$t('auth.username')" />
  </Avatar>

  <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
    {{ $t("auth.title") }}
  </h1>

  <div class="flex flex-row gap-4">
    <NuxtLink
      class="mt-1 font-medium underline text-primary underline-offset-4" href="/auth/login"
      target="_blank"
    >
      {{ $t("auth.links.login") }}
    </NuxtLink>

    <NuxtLink
      class="mt-1 font-medium underline text-primary underline-offset-4"
      href="/auth/logout"
      target="_blank"
    >
      {{ $t("auth.links.logout") }}
    </NuxtLink>
  </div>
</template>
