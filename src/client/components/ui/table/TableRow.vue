<script setup lang="ts">
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  pinned?: boolean | 'top' | 'bottom'
}>()
</script>

<template>
  <tr
    :class="cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      {
        'sticky': props.pinned,
        'top-0': props.pinned === 'top',
        'bottom-0': props.pinned === 'bottom',
      },
      props.class,
    )"
    :data-pinned="props.pinned"
  >
    <slot />
  </tr>
</template>
