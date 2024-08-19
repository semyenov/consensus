<script setup lang="ts">
const providers = await $fetch('/api/auth/providers')
</script>

<template>
  <!-- <div >

    <EdgeDbOAuthButton v-for="provider in providers" :key="provider.name" v-slot="{ redirect, loading }" :provider="provider.name">
      <Button :disabled="loading" type="button" class="mt-6 shadow-lg shadow-black/20" @click="redirect(provider.name)">
        {{ provider.display_name }}
      </Button>
    </EdgeDbOAuthButton> -->

  <EdgeDbAuthProviders>
    <EdgeDbOAuthButton
      v-for="provider in providers"
      :key="provider.name"
      v-slot="{ redirect, loading }"
      :provider="provider.name"
    >
      <Button :disabled="loading" type="button" class="mt-6 shadow-lg shadow-black/20" @click="redirect()">
        {{ provider.display_name }}
        {{ provider.name }}
      </Button>
    </EdgeDbOAuthButton>
  </EdgeDbAuthProviders>
  <!-- </div> -->
</template>
