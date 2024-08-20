<script setup lang="ts">
const { isLoggedIn, identity: user } = useEdgeDbIdentity()
const router = useRouter()
</script>

<template>
  <div v-if="isLoggedIn" class="flex flex-col items-center justify-center py-8">
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
      class="mt-6 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ user.name }}
    </h1>

    <h2
      class="text-2xl font-normal tracking-tight text-zinc-600 scroll-m-20 dark:text-zinc-400"
    >
      {{ user.email }}
    </h2>

    <p
      class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 max-w-80"
    >
      {{ $t("pages.index.description") }}
    </p>

    <div class="flex flex-row space-x-2">
      <Drawer v-if="user.assigned_issues.length">
        <DrawerTrigger>
          <Button class="shadow-lg shadow-black/10 mt-6">
            {{ $t("pages.index.drawer.trigger") }}
          </Button>
        </DrawerTrigger>
        <DrawerContent class="w-full overflow-hidden mx-auto">
          <DrawerHeader class="flex flex-col flex-shrink">
            <DrawerTitle>
              {{ $t("pages.index.drawer.title") }}
            </DrawerTitle>
            <DrawerDescription>
              {{ $t("pages.index.drawer.description") }}
            </DrawerDescription>
          </DrawerHeader>

          <!-- <ScrollArea class="w-full px-2 border-y h-[calc(100vh-220px)]"> -->
          <IssueView
            class="w-full overflow-auto relative flex flex-grow"
            :issues="user.assigned_issues"
          />

          <!-- <IssueTable :issues="user.assigned_issues" /> -->
          <!-- </ScrollArea> -->

          <!-- <DrawerFooter class="flex items-end"> -->
          <!--   <DrawerClose> -->
          <!--     <Button variant="outline"> -->
          <!--       {{ $t("pages.index.drawer.close") }} -->
          <!--     </Button> -->
          <!--   </DrawerClose> -->
          <!-- </DrawerFooter> -->
        </DrawerContent>
      </Drawer>

      <Button
        class="shadow-lg shadow-black/10 mt-6"
        type="button"
        variant="outline"
        @click="router.push('/auth/logout')"
      >
        {{ $t("pages.index.links.logout") }}
      </Button>
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-8">
    <h1
      class="mb-4 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl"
    >
      {{ $t("pages.index.title") }}
    </h1>

    <p
      class="text-sm leading-tight text-center text-gray-800 dark:text-gray-300 max-w-80"
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
  </div>
</template>
