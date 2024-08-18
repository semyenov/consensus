<script setup lang="ts">
const provider = {
  name: 'builtin::oauth_github',
  display_name: 'GitHub',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full h-full pb-8 text-center grow dark:text-white">
    <Avatar class="w-32 h-32 shadow-lg shadow-black/30" shape="circle">
      <AvatarImage src="https://avatars.githubusercontent.com/u/5471452?v=4" :alt="$t('auth.username')" />
    </Avatar>

    <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      {{ $t("auth.title") }}
    </h1>

    <div class="flex flex-row gap-4">
      <a
        class="mt-1 font-medium underline text-primary underline-offset-4" href="https://docs.edgedb.com"
        target="_blank"
      >
        {{ $t("auth.links.edgedb") }}
      </a>
      <a
        class="mt-1 font-medium underline text-primary underline-offset-4"
        href="https://www.shadcn-vue.com/examples/mail.html"
        target="_blank"
      >
        {{ $t("auth.links.shadcn") }}
      </a>
    </div>

    <EdgeDbOAuthButton :key="provider.name" v-slot="{ redirect, loading }" :provider="provider.name">
      <Button :disabled="loading" type="button" class="mt-6 shadow-lg shadow-black/20" @click="redirect(provider.name)">
        {{ provider.display_name }}
      </Button>
    </EdgeDbOAuthButton>
  </div>
</template>
