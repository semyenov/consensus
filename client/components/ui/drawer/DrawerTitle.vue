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
      cn('text-xl font-semibold leading-relaxed tracking-tight', props.class)
    "
  >
    <slot />
  </DrawerTitle>
</template>
