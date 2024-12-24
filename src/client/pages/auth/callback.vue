<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <EdgeDbOAuthCallback v-slot="{ loading, error, code, check }" redirect-to="/" :check-on-setup="false">
    <div
      class="flex flex-col items-center justify-center w-full h-full px-4 py-8"
    >
      <h1
        class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
      >
        {{ t("pages.auth/callback.title") }}
      </h1>
      <p
        class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80 max-w-screen"
      >
        {{ t("pages.auth/callback.description") }}
        <br>
        <br>
        {{ t("pages.auth/callback.code", { code }) }}
      </p>
      <Button
        class="mt-6 shadow-lg shadow-black/10"
        variant="outline"
        :disabled="loading || error"
        @click="check()"
      >
        <span>{{ t("pages.auth/callback.links.home") }}</span>
      </Button>
    </div>
  </EdgeDbOAuthCallback>
</template>
