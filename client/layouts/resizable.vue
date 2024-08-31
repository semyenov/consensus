<script setup lang="ts">
import { MoonIcon, SunIcon } from '@radix-icons/vue'

const { isLoggedIn } = useEdgeDbIdentity()

const isDark = useDark()
const toggleDark = useToggle(isDark)
const { identity: user } = useEdgeDbIdentity()
</script>

<template>
  <div>
    <ResizablePanelGroup
      id="__layout"
      direction="horizontal"
      class="h-full max-w-full"
    >
      <ResizablePanel id="demo-panel-2" class="shadow-xl" :default-size="25">
        <ResizablePanelGroup id="demo-group-3" direction="vertical">
          <ResizablePanel id="demo-panel-3" :default-size="25">
            <div class="flex items-center justify-center h-full p-6">
              <span class="font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle id="demo-handle-2" />
          <ResizablePanel v-if="isLoggedIn" :default-size="75">
            <IssueView :issues="user.assigned_issues" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle id="demo-handle-1" />
      <ResizablePanel
        id="__layout"
        direction="horizontal"
        :default-size="75"
        class="flex flex-col items-center justify-center"
      >
        <ResizablePanelGroup id="demo-group-1" direction="vertical">
          <slot />

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
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>

<style lang="postcss">
html,
body,
#__nuxt,
#__layout {
  @apply flex-1 !h-screen !w-screen;
}
#__layout {
  @apply flex flex-col;
}
</style>
