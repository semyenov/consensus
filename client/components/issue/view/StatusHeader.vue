<script setup lang="ts">
import { CaretSortIcon } from '@radix-icons/vue'

import { Button } from '@/components/ui/button'

defineEmits<{
  (e: 'toggleSort'): void
}>()
</script>

<template>
  <Button
    variant="secondary"
    class="flex justify-start w-full h-full px-4 py-2 capitalize rounded-none text-nowrap"
    @click="$emit('toggleSort')"
  >
    {{ $t('modules.issue.status') }}
    <CaretSortIcon class="ml-1" />
  </Button>
</template>
