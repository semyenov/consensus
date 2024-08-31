<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <AuthBaseEdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
    <div class="flex flex-col items-center justify-center py-8">
      <h1
        class="text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
      >
        {{ t("pages.auth/login.title") }}
      </h1>
      <p
        class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80"
      >
        {{ t("pages.auth/login.description") }}
      </p>
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
    </div>
  </AuthBaseEdgeDbAuthProviders>
</template>
