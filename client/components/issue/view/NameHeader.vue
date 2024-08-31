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
    class="flex justify-start w-full h-full p-2 capitalize rounded-none text-nowrap"
    @click="$emit('toggle-sort')"
  >
    {{ $t('modules.issue.name') }}
    <CaretSortIcon class="ml-1" />
  </Button>
</template>
