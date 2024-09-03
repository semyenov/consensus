<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <Suspense>
    <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
      <div class="flex flex-col items-center justify-center py-8">
        <div class="flex flex-row gap-4">
          <EdgeDbOAuthButton
            v-for="provider in providers"
            v-slot="{ redirect, loading }"
            :key="provider.name"
            :provider="provider.name"
          >
            <Button
              class="shadow-lg shadow-black/20"
              type="button"
              :disabled="loading"
              @click="redirect(provider.name)"
            >
              {{ provider.display_name }}
            </Button>
          </EdgeDbOAuthButton>
        </div>
      </div>
    </EdgeDbAuthProviders>
  </Suspense>
</template>
