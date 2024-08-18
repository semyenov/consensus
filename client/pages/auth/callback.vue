<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <EdgeDbOAuthCallback v-slot="{ loading, error }" redirect-to="/">
    <div class="flex flex-col items-center justify-center w-full h-full pb-10 text-center grow dark:text-white">
      <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
        {{ $t("callback.title") }}
      </h1>
      <Button
        class="mt-6 shadow-lg shadow-black/20"
        variant="outline"
        :disabled="loading || error"
        @click="router.push('/')"
      >
        <span>{{ $t("callback.links.home") }}</span>
      </Button>
    </div>
  </EdgeDbOAuthCallback>
</template>
