<script lang="ts" setup>
import { computed, ref } from 'vue'

const providers = ref<{ name: string, display_name: string }[]>([])
const oAuthProviders = computed(() => providers.value.filter(p => p?.name?.includes('oauth_')))
const loading = ref(false)
const error = ref()
loading.value = true

try {
  providers.value = await $fetch(`/api/auth/providers`)
}
catch (error_) {
  error.value = error_
}
finally {
  loading.value = false
}
</script>

<template>
  <div>
    test
    <slot v-bind="{ providers, oAuthProviders, loading, error }" />
  </div>
</template>
