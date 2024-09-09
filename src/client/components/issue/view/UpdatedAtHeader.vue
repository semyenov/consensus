<script setup lang="ts">
import { CaretSortIcon } from '@radix-icons/vue'

import { Button } from '@/components/ui/button'

defineEmits<{
  (e: 'toggle-sort'): void
}>()
</script>

<template>
  <Button
    variant="secondary"
    class="flex justify-end w-full h-full px-4 py-2 capitalize rounded-none text-nowrap backdrop-blur-sm bg-secondary/80"
    @click="$emit('toggle-sort')"
  >
    {{ $t('modules.issue.updated_at') }}
    <CaretSortIcon class="ml-1" />
  </Button>
</template>
