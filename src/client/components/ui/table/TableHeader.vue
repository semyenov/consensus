<script setup lang="ts">
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <thead :class="cn('[&_tr]:border-b p-0', props.class)">
    <slot />
  </thead>
</template>
