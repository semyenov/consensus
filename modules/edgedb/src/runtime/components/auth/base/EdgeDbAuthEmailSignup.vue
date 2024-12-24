<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#imports'

const props = withDefaults(
  defineProps<{ redirectTo?: string }>(),
  {
    redirectTo: '/',
  },
)

const email = ref()
function updateEmail(value: string) {
  email.value = value
}
const password = ref()
function updatePassword(value: string) {
  password.value = value
}

const name = ref()
function updateName(value: string) {
  name.value = value
}

const error = ref()
const success = ref()
const loading = ref(false)

async function submit(provider: string = 'builtin::local_emailpassword') {
  error.value = undefined
  success.value = undefined
  loading.value = true
  try {
    const result = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        name: name.value,
        provider,
      },
    })




    success.value = true

    if (props.redirectTo)
      setTimeout(async () => await navigateTo(props.redirectTo), 1)

    return result
  }
  catch (e) {
    error.value = e
  }
  finally {
    loading.value = false
  }
}

defineExpose({
  email,
  updateEmail,
  password,
  updatePassword,
  name,
  updateName,
  submit,
  success,
  loading,
})
</script>

<template>
  <slot v-bind="{ email, updateEmail, password, updatePassword, name, updateName, submit, loading }" />
</template>
