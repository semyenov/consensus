<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'

defineProps<{
  checked: boolean
}>()

defineEmits<{
  (e: 'update:checked', value: boolean): void
}>()
</script>

<template>
  <div class="flex items-center justify-center w-full h-full px-4 capitalize text-nowrap">
    <Checkbox
      :checked="checked"
      aria-label="Select row"
      @update:checked="$emit('update:checked', $event)"
    />
  </div>
</template>
