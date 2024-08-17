<script setup lang="ts">
import { MoonIcon, SunIcon } from '@radix-icons/vue'

const route = useRoute()
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <ClientOnly>
    <Button
      class="top-4 right-4 absolute rounded-full" type="menu" size="icon" variant="secondary"
      @click="toggleDark()"
    >
      <SunIcon v-if="isDark" />
      <MoonIcon v-else />
    </Button>
  </ClientOnly>
  <slot :key="route.path" name="default" />
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply  h-full bg-white text-zinc-900
  dark:bg-zinc-900 dark:text-white;
}
</style>
