<script setup lang="ts">
const { t } = useI18n();
const emailRef = ref('')
function onSubmit(email: string) {
  navigateTo(`/auth/confirm-email?email=${email}`)
}
</script>

<template>
  <div>
    <Card class="border-none">
      <CardHeader>
        <div class="flex flex-col items-center justify-center">
          <h1 class="text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
            {{ t("pages.auth/signup.title") }}
          </h1>
          <p class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80">
            {{ t("pages.auth/signup.description") }}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <EdgeDbAuthEmailSignup redirect-to="" v-slot="{ email, updateEmail, password, updatePassword, name, updateName, submit, loading }">
          <Input class="mb-2" type="text" :value="name" placeholder="name"
          @update:model-value="(v) => updateName(v as string)" />

          <Input class="mb-2" type="email" :value="email" placeholder="your@email.com"
                @update:model-value="(v) => updateEmail(v as string)" />

              <Input type="password" :value="password" placeholder="password"
              @update:model-value="(v) => updatePassword(v as string)" />

          <Button type="button" @click="async (e) =>  email && !loading && await submit() && onSubmit(email)" class="mt-6">
            {{ loading ? "Loading" : "Signup" }}
          </Button>
        </EdgeDbAuthEmailSignup>
      </CardContent>
    </Card>
  </div>
</template>
