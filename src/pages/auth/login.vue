<template>
  <!-- Gives access to all available auth providers -->
  <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
    <!-- Create a OAuth button behavior from a provider name -->
    <EdgeDbOAuthButton
      v-for="provider of providers"
      :key="provider.name"
      v-slot="{ redirect, error }"
      :provider="provider.name"
    >
      <!-- Call `redirect` from the OAuthButton -->
      <Button class="w-full" size="lg" type="button" variant="outline" @click="() => redirect()">
        {{ provider.display_name }}
        {{ error }}
      </Button>
    </EdgeDbOAuthButton>
  </EdgeDbAuthProviders>
</template>
