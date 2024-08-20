<script setup lang="ts">
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <th :class="cn('h-10 p-0 text-left align-middle font-medium text-muted-foreground', props.class)">
    <slot />
  </th>
</template>
