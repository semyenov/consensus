<script setup lang="ts">
import { MoonIcon, SunIcon } from "@radix-icons/vue";

const route = useRoute();
const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <ClientOnly>
    <Button class="absolute rounded-full top-4 right-4" type="menu" size="icon" variant="secondary"
      @click="toggleDark()">
      <SunIcon v-if="isDark" />
      <MoonIcon v-else />
    </Button>
  </ClientOnly>
  <slot name="default" :key="route.path" />
</template>
