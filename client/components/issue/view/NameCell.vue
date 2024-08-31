<script setup lang="ts">
defineProps<{
  name: string
}>()

defineEmits<{
  (e: 'toggleExpanded'): void
}>()
</script>

<template>
  <div
    class="flex h-full p-2 capitalize rounded-none min-w-[200px]"
    @click="$emit('toggleExpanded')"
  >
    {{ name }}
  </div>
</template>
