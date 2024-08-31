<script setup lang="ts">
defineProps<{
  status: string
}>()
</script>

<template>
  <div class="px-4">
    <Badge variant="primary">
      {{ status }}
    </Badge>
  </div>
</template>
