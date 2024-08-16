<template>
  <EdgeDbOAuthCallback
    v-slot="{ loading }"
    redirect-to="/"
  >
    <div>
      <h2>OAuth callback</h2>
      <p v-if="loading">
        Loading...
      </p>
    </div>
  </EdgeDbOAuthCallback>
</template>
