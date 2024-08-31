<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <AuthBaseEdgeDbAuthLogout
    v-slot="{ logout }"
    :logout-on-setup="false"
    redirect-to="/"
  >
    <div
      class="flex flex-col items-center justify-center w-full h-full px-4 py-8"
    >
      <h1
        class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
      >
        {{ t("pages.auth/logout.title") }}
      </h1>
      <p
        class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80 max-w-screen"
      >
        {{ t("pages.auth/logout.description") }}
      </p>
      <Button
        class="mt-6 shadow-lg shadow-black/10"
        type="button"
        variant="outline"
        @click="logout()"
      >
        <span>{{ t("pages.auth/logout.links.logout") }}</span>
      </Button>
    </div>
  </AuthBaseEdgeDbAuthLogout>
</template>
