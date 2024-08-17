<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <EdgeDbOAuthCallback v-slot="{ loading, error }" redirect-to="/">
    <div class="grow dark:text-white flex flex-col items-center justify-center w-full h-full pb-10 text-center">
      <h1 class="scroll-m-20 lg:text-5xl mt-4 text-4xl font-extrabold tracking-tight">
        {{ $t("callback.title") }}
      </h1>
      <Button
        class="shadow-black/20 mt-6 shadow-lg"
        variant="outline"
        :disabled="loading || error"
        @click="router.push('/')"
      >
        <span>{{ $t("callback.links.home") }}</span>
      </Button>
    </div>
  </EdgeDbOAuthCallback>
</template>
