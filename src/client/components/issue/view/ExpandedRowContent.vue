<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

import type { issue } from '#edgedb/interfaces'

defineProps<{
  issue: issue.Issue
}>()
</script>

<template>
  <div class="flex flex-col flex-grow px-4 py-4 bg-secondary/50 dark:bg-accent/75">
    <div class="flex flex-row items-center justify-between gap-2">
      <h2 class="text-2xl">
        {{ issue.name }}
      </h2>
      <Badge v-if="issue.priority" variant="outline">
        {{ issue.priority }}
      </Badge>
    </div>
    <p class="text-sm text-muted-foreground">
      {{ issue.id }}
    </p>
  </div>
</template>
