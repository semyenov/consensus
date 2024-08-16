<script setup lang="ts">
import { MoonIcon, SunIcon } from '@radix-icons/vue'

const isDark = useDark({ flush: 'post' })
const toggleDark = useToggle(isDark)

const provider = {
  id: 'builtin::oauth_github',
  title: 'GitHub',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full h-full pb-8 text-center grow dark:text-white">
    <ClientOnly>
      <Button class="absolute rounded-full top-4 right-4" type="button" size="icon" variant="outline"
        @click="toggleDark()">
        <SunIcon v-if="isDark" />
        <MoonIcon v-else />
      </Button>
    </ClientOnly>

    <Avatar shape="square" class="w-32 h-32 mt-4 shadow-lg">
      <AvatarImage src="https://avatars.githubusercontent.com/u/5471452?v=4" :alt="$t('auth.username')" />
    </Avatar>

    <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      {{ $t("auth.title") }}
    </h1>
    <a class="mt-1 font-medium underline text-primary underline-offset-4" href="https://www.shadcn-vue.com"
      target="_blank">
      {{ $t("auth.description") }}
    </a>

    <EdgeDbOAuthButton :key="provider.id" v-slot="{ redirect, loading }" :provider="provider.id">
      <Button v-if="!loading" type="button" class="mt-6" @click="redirect(provider.id)">
        {{ provider.title }}
      </Button>
    </EdgeDbOAuthButton>
  </div>
</template>
