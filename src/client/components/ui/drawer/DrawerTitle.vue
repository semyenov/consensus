<script lang="ts" setup>
import { DrawerTitle } from 'vaul-vue'
import { type HtmlHTMLAttributes, computed } from 'vue'

import { cn } from '@/lib/utils'

import type { DrawerTitleProps } from 'vaul-vue'

const props = defineProps<
  DrawerTitleProps & { class?: HtmlHTMLAttributes['class'] }
>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DrawerTitle
    v-bind="delegatedProps"
    :class="
      cn('text-2xl font-bold tracking-tight', props.class)
    "
  >
    <slot />
  </DrawerTitle>
</template>
