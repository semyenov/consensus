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
    <AuthOAuth />
  </div>
</template>
