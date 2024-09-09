
<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Mail as IconMail } from 'lucide-vue-next'

const route = useRoute()
const { t } = useI18n()

const emailAddress = ref('')

onMounted(() => {
  emailAddress.value = route.query.email?.toString() || ''
})


</script>

<template>
  <div class="container max-w-md p-4 mx-auto">
    <Card class="w-full">
      <CardHeader>
        <CardTitle>{{ t('pages.confirmEmail.title') }}</CardTitle>
        <CardDescription v-if="emailAddress">
          {{ t('pages.confirmEmail.descriptionWithEmail', { email: emailAddress }) }}
        </CardDescription>
        <CardDescription v-else>
          {{ t('pages.confirmEmail.descriptionWithoutEmail') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="mb-4 text-center">
          <IconMail class="mx-auto mb-2" :size="48" />
          <p class="text-sm text-gray-500">{{ t('pages.confirmEmail.checkSpam') }}</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

