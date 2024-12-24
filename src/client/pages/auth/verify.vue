<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-background">
<EdgeDbAuthEmailVerify redirect-to="" v-slot="{check, success, verificationToken, loading}">
  <Loader v-if="loading" />
  <Card v-if="!loading && success" class="w-[350px]">
      <CardHeader>
        <CardTitle>{{ t('pages.verify.title') }}</CardTitle>
        <CardDescription>{{ t('pages.verify.description') }}</CardDescription>
      </CardHeader>
      <CardContent>
        <CheckCircle class="w-16 h-16 mx-auto text-primary" />
        <p class="mt-4 text-center">{{ t('pages.verify.message') }}</p>
      </CardContent>
      <CardFooter class="flex justify-center">
        <Button @click="navigateTo('/')">{{ t('pages.verify.homeButton') }}</Button>
      </CardFooter>
    </Card>
    <Card v-else class="w-[350px]">
      <CardHeader>
        <CardTitle>{{ t('pages.verify.errorTitle') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="mt-4 text-center">{{ t('pages.verify.errorMessage') }}</p>
      </CardContent>
      <CardFooter class="flex justify-center">
        <Button @click="check">{{ t('pages.verify.retryButton') }}</Button>
      </CardFooter>
    </Card>
</EdgeDbAuthEmailVerify>
  </div>
</template>
