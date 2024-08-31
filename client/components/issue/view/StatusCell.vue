<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

defineProps<{
  status: string
}>()
</script>

<template>
  <div class="flex w-full h-full p-2 capitalize rounded-none text-nowrap">
    <Badge variant="secondary">
      {{ status }}
    </Badge>
  </div>
</template>
