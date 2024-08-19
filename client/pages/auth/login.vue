<template>
  <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
    <h1 class="text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      {{ $t("pages.auth/login.title") }}
    </h1>

    <div class="flex flex-row gap-4 mt-6">
      <EdgeDbOAuthButton
        v-for="provider in providers"
        v-slot="{ redirect, loading }"
        :key="provider.name"
        :provider="provider.name"
      >
        <Button
          class="shadow-lg shadow-black/20"
          type="button"
          :disabled="loading"
          @click="redirect(provider.name)"
        >
          {{ provider.display_name }}
        </Button>
      </EdgeDbOAuthButton>
    </div>
  </EdgeDbAuthProviders>
</template>
