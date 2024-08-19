<script setup lang="ts"></script>

<template>
  <EdgeDbAuthLogout
    v-slot="{ logout }"
    redirect-to="/"
    :logout-on-setup="false"
  >
    <h1
      class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ $t("pages.auth/logout.title") }}
    </h1>

    <p
      class="mt-4 text-sm leading-6 text-center text-gray-800 dark:text-gray-300 max-w-80"
    >
      {{ $t("pages.auth/logout.description") }}
    </p>

    <Button
      class="mt-4 shadow-lg shadow-black/10"
      type="button"
      variant="outline"
      @click="logout()"
    >
      <span>{{ $t("pages.auth/logout.links.logout") }}</span>
    </Button>
  </EdgeDbAuthLogout>
</template>
