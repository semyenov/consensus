<script setup lang="ts">
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  pinned?: boolean | 'left' | 'right'
}>()
</script>

<template>
  <th
    :class="
      cn(
        'h-12 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        {
          'sticky z-30': props.pinned,
          'left-0': props.pinned === 'left',
          'right-0': props.pinned === 'right',
        },
        props.class,
      )
    "
    :data-pinned="props.pinned"
  >
    <slot />
  </th>
</template>
