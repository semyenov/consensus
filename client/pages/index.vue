<script setup lang="ts">
const {
  isLoggedIn,
  identity: user,
} = useEdgeDbIdentity()

const router = useRouter()
</script>

<template>
  <template v-if="isLoggedIn">
    <Avatar class="w-32 h-32 shadow-lg shadow-black/30" shape="circle">
      <AvatarImage
        :alt="user.identity?.id"
        :src="user.identity ? `https://avatars.githubusercontent.com/u/${
          user.identity?.subject}?v=4` : ''"
      />
    </Avatar>

    <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      {{ user.identity?.subject }}
    </h1>

    <div class="flex flex-row gap-4">
      <Button
        class="mt-6 shadow-lg shadow-black/10"
        type="button"
        variant="outline"
        @click="router.replace('/auth/logout')"
      >
        {{ $t("pages.index.links.logout") }}
      </Button>
    </div>
  </template>

  <template v-else>
    <h1 class="mt-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
      {{ $t("pages.index.title") }}
    </h1>

    <div class="flex flex-row gap-4">
      <Button
        class="mt-6 shadow-lg shadow-black/10"
        type="button"
        variant="outline"
        @click="router.replace('/auth/login')"
      >
        {{ $t("pages.index.links.login") }}
      </Button>
    </div>
  </template>
</template>
