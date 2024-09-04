<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
    <div class="flex flex-col items-center justify-center py-8">
    <Suspense>
     <EdgeDbAuthEmailLogin
        v-slot="{
          email,
          updateEmail,
          password,
          updatePassword,
          submit,
          loading,
        }"
        redirect-to="/"
      >
        <div>
            <Input class="mb-2" type="email" :value="email" placeholder="your@email.com" @change="(e) => updateEmail(e.target.value)" />
            <Input type="password" :value="password" placeholder="password" @change="(e) => updatePassword(e.target.value)" />

          <Button type="button" @click="(e) => !loading && submit()" class="mt-6">
            {{ loading ? "Loading" : "Login" }}
          </Button>
        </div>
      </EdgeDbAuthEmailLogin>
    </Suspense>
</div>
</template>
