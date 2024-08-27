<script setup lang="ts">
definePageMeta({
  layout: 'resizable',
})

const { t } = useI18n()
const { isLoggedIn, identity: user } = useEdgeDbIdentity()
const router = useRouter()
</script>

<template>
  <div
    v-if="isLoggedIn"
    class="flex flex-col items-center justify-center w-full h-full"
  >
    <Avatar
      v-if="user.identity.subject"
      class="w-32 h-32 shadow-lg shadow-black/20"
      shape="circle"
    >
      <!-- <NuxtImg class="object-cover w-full h-full" :src="user.identity.subject" presrt="avatar" /> -->
      <AvatarImage
        :alt="user.identity.id"
        :src="`https://avatars.githubusercontent.com/u/${user.identity.subject}`"
      />
    </Avatar>

    <h1
      class="mt-6 text-4xl font-extrabold tracking-tight text-center scroll-m-20 lg:text-5xl"
    >
      {{ user.name }}
    </h1>

    <h2
      class="text-2xl font-normal tracking-tight text-zinc-600 scroll-m-20 dark:text-zinc-400"
    >
      {{ user.email }}
    </h2>

    <p
      class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80 max-w-screen"
    >
      {{ t("pages.index.description") }}
    </p>

    <Drawer v-if="user.assigned_issues.length">
      <DrawerTrigger>
        <Button class="mt-6 shadow-lg shadow-black/30">
          {{ t("pages.index.drawer.trigger") }}
        </Button>
      </DrawerTrigger>
      <DrawerContent class="w-3/4 mx-auto max-w-screen">
        <DrawerHeader>
          <DrawerTitle>
            <span>{{ t("pages.index.drawer.title") }}</span>
          </DrawerTitle>
          <DrawerDescription>
            {{ t("pages.index.drawer.description") }}
          </DrawerDescription>
        </DrawerHeader>

        <div class="w-full">
          <IssueView
            class="w-full"
            :issues="user.assigned_issues"
          />
        </div>
      </DrawerContent>
    </Drawer>

    <div class="flex flex-row space-x-2">
      <Button
        class="mt-2"
        type="button"
        variant="link"
        @click="router.push('/auth/logout')"
      >
        {{ t("pages.index.links.logout") }}
      </Button>
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-8">
    <h1
      class="mb-4 text-4xl font-extrabold tracking-tight text-center scroll-m-20 lg:text-5xl"
    >
      {{ t("pages.index.title") }}
    </h1>

    <p
      class="text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80 max-w-screen"
    >
      {{ t("pages.index.description") }}
    </p>

    <Button
      class="mt-6 shadow-lg shadow-black/10"
      type="button"
      variant="outline"
      @click="router.push('/auth/login')"
    >
      <span>{{ t("pages.index.links.login") }}</span>
    </Button>
  </div>
</template>
