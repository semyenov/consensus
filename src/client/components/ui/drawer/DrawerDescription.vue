<script lang="ts" setup>
import { DrawerDescription } from 'vaul-vue'
import { type HtmlHTMLAttributes, computed } from 'vue'

import { cn } from '@/lib/utils'

import type { DrawerDescriptionProps } from 'vaul-vue'

const props = defineProps<
  DrawerDescriptionProps & { class?: HtmlHTMLAttributes['class'] }
>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <DrawerDescription
    v-bind="delegatedProps"
    :class="cn('text-sm leading-tight text-muted-foreground', props.class)"
  >
    <slot />
  </DrawerDescription>
</template>
