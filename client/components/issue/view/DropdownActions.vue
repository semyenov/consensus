<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n' // Ensure this import is present

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
  issue: {
    id: string
  }
}>()

defineEmits<{
  (e: 'expand'): void
}>()

function copy(id: string) {
  navigator.clipboard.writeText(id)
}

const { t } = useI18n() // Initialize i18n
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-8 p-0">
        <span class="sr-only">{{ t('pages.index.links.open_menu') }}</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{{ t('pages.index.links.actions') }}</DropdownMenuLabel>
      <DropdownMenuItem @click="copy(issue.id)">
        {{ t('pages.index.links.copy_issue_id') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="$emit('expand')">
        {{ t('pages.index.links.expand') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>{{ t('pages.index.links.view_customer') }}</DropdownMenuItem>
      <DropdownMenuItem>{{ t('pages.index.links.view_issue_details') }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
