<template>
  <EdgeDbOAuthCallback
    v-slot="{ loading, error }"
    redirect-to="/"
  >
    <div>
      <h2>OAuth callback</h2>
      {{ error }}
      <p v-if="loading">
        Loading...
      </p>
    </div>
  </EdgeDbOAuthCallback>
</template>
