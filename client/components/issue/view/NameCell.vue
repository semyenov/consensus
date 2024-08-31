<script setup lang="ts">
defineProps<{
  name: string
}>()

defineEmits<{
  (e: 'toggle-expanded'): void
}>()
</script>

<template>
  <div
    class="flex w-full h-full p-2 capitalize rounded-none text-nowrap"
    @click="$emit('toggle-expanded')"
  >
    {{ name }}
  </div>
</template>
