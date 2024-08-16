<script setup lang="ts">
import { ArrowDownIcon } from '@radix-icons/vue'
</script>

<template>
  <EdgeDbOAuthCallback v-slot="{ loading }" redirect-to="/">
    <div class="flex flex-col items-center justify-center w-full h-full pb-8 text-center grow dark:text-white">
      <h2 class="mt-2 text-3xl font-extrabold tracking-tight scroll-m-16 lg:text-4xl">OAuth callback</h2>
      <Button class="mt-6" v-if="loading">
        Loading...
        <ArrowDownIcon />
      </Button>
      >
    </div>
  </EdgeDbOAuthCallback>
</template>
