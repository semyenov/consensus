<script setup lang="ts">
import { MoonIcon, SunIcon } from '@radix-icons/vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div
    id="__layout"
    class="flex flex-col items-center justify-center w-full h-full pb-8 text-center grow dark:text-white"
  >
    <ClientOnly>
      <Button
        class="absolute rounded-full top-4 right-4"
        type="menu"
        size="icon"
        variant="outline"
        @click="toggleDark()"
      >
        <SunIcon v-if="isDark" />
        <MoonIcon v-else />
      </Button>
    </ClientOnly>
    <slot name="default" />
  </div>
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply h-full;
}
</style>
