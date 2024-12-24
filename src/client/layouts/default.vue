<script setup lang="ts">
import { MoonIcon, SunIcon } from '@radix-icons/vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div
    id="__layout"
    class="flex flex-col items-center justify-center w-full h-full text-center grow dark:text-white"
  >
    <ClientOnly>
      <Button
        class="absolute border border-gray-300 border-dashed rounded-full dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 top-4 right-4"
        type="menu"
        size="icon"
        variant="outline"
        @click="toggleDark()"
      >
        <SunIcon v-if="isDark" />
        <MoonIcon v-else />
      </Button>
    </ClientOnly>
    <slot />
  </div>
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply !h-screen !w-screen;
}
</style>
