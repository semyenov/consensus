<script setup lang="ts">
import type { issue } from '#edgedb/interfaces'

const props = withDefaults(
  defineProps<{
    issues: issue.Issue[]
  }>(),
  {
    issues: () => [],
  },
)
</script>

<template>
  <Table>
    <TableBody>
      :cc
      <TableRow v-for="item in props.issues" :key="item.id">
        <TableCell class="font-medium">
          {{ item.name }}
        </TableCell>
        <!-- <TableCell>{{ item.description }}</TableCell> -->
        <TableCell>
          <Badge :variant="item.status === 'Open' ? 'outline' : 'secondary'">
            {{ item.status }}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge>{{ item.priority }}</Badge>
        </TableCell>
        <TableCell class="text-right">
          {{ $d(item.created_at) }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
