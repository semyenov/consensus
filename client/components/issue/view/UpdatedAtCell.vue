<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  updatedAt: Date
}>()

const { d } = useI18n()

const formattedDate = computed(() => d(props.updatedAt))
</script>

<template>
  <div class="flex justify-end w-full h-full px-4 py-2 capitalize rounded-none text-nowrap">
    {{ formattedDate }}
  </div>
</template>
