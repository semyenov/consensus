<script setup lang="ts">
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div class="flex flex-col justify-center items-center w-full h-full text-center grow dark:text-white">
    <Avatar shape="square" class="w-32 h-32">
      <AvatarImage
        src="https://avatars.githubusercontent.com/u/5471452?v=4"
        alt="Avatar image"
      />
    </Avatar>
    <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      Fresh Nuxt Bootstrap
    </h1>
    <a class="mt-1 font-medium underline text-primary underline-offset-4" href="https://www.shadcn-vue.com" target="_blank">Learn more about Shadcn Vue</a>
    <a class="mt-1 font-medium underline text-primary underline-offset-4" href="/auth/login" target="_self">Login</a>
    <Button class="mt-6" size="lg" @click="toggleDark()">
      Toggle {{ isDark ? 'Light' : 'Dark' }}
    </Button>
  </div>
</template>
