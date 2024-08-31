<script setup lang="ts">
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
  pinned?: boolean | 'left' | 'right'
}>()
</script>

<template>
  <td
    :class="
      cn(
        'align-middle',
        {
          'sticky': !!props.pinned,
          'left-0': props.pinned === 'left',
          'right-0': props.pinned === 'right',
        },
        props.class,
      )
    "
    :data-pinned="props.pinned"
  >
    <slot />
  </td>
</template>
