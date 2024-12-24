<script setup lang="ts">
import { CaretSortIcon } from '@radix-icons/vue'

import { Button } from '@/components/ui/button'

defineEmits<{
  (e: 'toggleSort'): void
}>()

const { t } = useI18n()
</script>

<template>
  <Button
    variant="secondary"
    class="flex justify-start w-full h-full capitalize text-nowrap backdrop-blur-sm bg-secondary/80"
    @click="$emit('toggleSort')"
  >
    {{ t('modules.issue.status') }}
    <CaretSortIcon class="ml-1" />
  </Button>
</template>
