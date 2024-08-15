<template>
  <!-- Gives access to all available auth providers -->
  <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
    <!-- Create a OAuth button behavior from a provider name -->
    <EdgeDbOAuthButton
      v-for="provider of providers"
      :key="provider.name"
      v-slot="{ redirect }"
      :provider="provider.name"
    >
      <!-- Call `redirect` from the OAuthButton -->
      <button @click="() => redirect()">
        {{ provider.display_name }}
      </button>
    </EdgeDbOAuthButton>
  </EdgeDbAuthProviders>
</template>
