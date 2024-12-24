<script setup lang="ts">
defineProps<{
  status: string
}>()
</script>

<template>
  <div class="px-4 py-2">
    <Badge variant="default">
      {{ status }}
    </Badge>
  </div>
</template>
