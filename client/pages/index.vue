<script setup lang="ts">
const { isLoggedIn, identity: user } = useEdgeDbIdentity()
const router = useRouter()
</script>

<template>
  <template v-if="isLoggedIn">
    <Avatar class="w-32 h-32 mb-6 shadow-lg shadow-black/20" shape="circle">
      <AvatarImage
        :alt="user.identity?.id"
        :src="
          user.identity
            ? `https://avatars.githubusercontent.com/u/${
              user.identity?.subject
            }?v=4`
            : ''
        "
      />
    </Avatar>

    <h1
      class="mb-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ user.identity?.subject }}
    </h1>

    <p
      class="text-sm leading-6 text-center text-gray-800 dark:text-gray-300 max-w-80"
    >
      {{ $t("pages.index.description") }}
    </p>

    <Button
      class="mt-6 shadow-lg shadow-black/10"
      type="button"
      variant="outline"
      @click="router.push('/auth/logout')"
    >
      {{ $t("pages.index.links.logout") }}
    </Button>
  </template>

  <template v-else>
    <h1
      class="mb-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ $t("pages.index.title") }}
    </h1>

    <p
      class="text-sm leading-6 text-center text-gray-800 dark:text-gray-300 max-w-80"
    >
      {{ $t("pages.index.description") }}
    </p>

    <Button
      class="mt-6 shadow-lg shadow-black/10"
      type="button"
      variant="outline"
      @click="router.push('/auth/login')"
    >
      {{ $t("pages.index.links.login") }}
    </Button>
  </template>
</template>
