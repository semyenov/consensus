<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <Suspense>
    <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
      <div class="flex flex-col items-center justify-center py-8">

        <div class="mt-6 text-center w-max">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs ">
              <span class="bg-background px-2 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>
        </div>
        {{ providers }}
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
