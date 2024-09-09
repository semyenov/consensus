<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div>

    <Card class="border-none">
      <CardHeader>
        <div class="flex flex-col items-center justify-center">
          <h1 class="text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
            {{ t("pages.auth/login.title") }}
          </h1>
          <p class="mt-4 text-sm leading-tight text-center text-gray-800 dark:text-gray-300 w-80">
            {{ t("pages.auth/login.description") }}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <Suspense>
          <EdgeDbAuthEmailLogin v-slot="{
            email,
            updateEmail,
            password,
            updatePassword,
            submit,
            loading,
          }" redirect-to="/">
            <div>
              <Input class="mb-2" type="email" :value="email" placeholder="your@email.com"
                @update:model-value="(v) => updateEmail(v as string)" />
              <Input type="password" :value="password" placeholder="password"
              @update:model-value="(v) => updatePassword(v as string)" />

              <Button type="button" @click="(e) => !loading && submit()" class="mt-6">
                {{ loading ? "Loading" : "Login" }}
              </Button>
            </div>
          </EdgeDbAuthEmailLogin>
        </Suspense>

        <div class="relative flex flex-col items-center mt-4">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-2 bg-background text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>

        <Suspense>
          <EdgeDbAuthProviders v-slot="{ oAuthProviders: providers }">
            <div class="flex flex-col items-center justify-center py-8">
              <div class="flex flex-row gap-4">
                <EdgeDbOAuthButton v-for="provider in providers" v-slot="{ redirect, loading }" :key="provider.name"
                  :provider="provider.name">
                  <Button class="shadow-lg shadow-black/20" type="button" :disabled="loading"
                    @click="redirect(provider.name)">
                    {{ provider.display_name }}
                  </Button>
                </EdgeDbOAuthButton>
              </div>
            </div>
          </EdgeDbAuthProviders>
        </Suspense>
      </CardContent>

      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          Not a member?
          <a href="/auth/signup" class="text-primary hover:underline">Register now</a>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
