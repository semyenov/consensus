<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div>
    <div class="flex flex-col items-center justify-center">
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
    </div>

    <AuthEmail />

    <div class="relative flex flex-col items-center mt-4">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-background text-muted-foreground">
          or continue with
        </span>
      </div>
    </div>

    <AuthOAuth />
  </div>
</template>
