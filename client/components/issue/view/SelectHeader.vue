<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'

defineProps<{
  checked: boolean | 'indeterminate'
}>()

defineEmits<{
  (e: 'update:checked', value: boolean): void
}>()
</script>

<template>
  <div class="flex items-center justify-center w-full h-full px-4 capitalize text-nowrap bg-accent dark:bg-secondary">
    <Checkbox
      :checked="checked"
      @update:checked="$emit('update:checked', $event)"
    />
  </div>
</template>
