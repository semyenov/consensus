<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <EdgeDbOAuthCallback v-slot="{ loading, error }" redirect-to="/">
    <h1
      class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ $t("pages.auth/callback.title") }}
    </h1>

    <p
      class="mt-4 text-sm leading-6 text-center text-gray-800 dark:text-gray-300 max-w-80"
    >
      {{ $t("pages.auth/callback.description") }}
    </p>

    <Button
      class="mt-6 shadow-lg shadow-black/10"
      variant="outline"
      :disabled="loading || error"
      @click="router.push('/')"
    >
      <span>{{ $t("pages.auth/callback.links.home") }}</span>
    </Button>
  </EdgeDbOAuthCallback>
</template>
