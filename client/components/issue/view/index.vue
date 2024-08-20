<script setup lang="ts">
import { CaretSortIcon, ChevronDownIcon } from '@radix-icons/vue'
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { h, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, valueUpdater } from '@/lib/utils'

import DropdownAction from './DropdownActions.vue'

import type { issue } from '#edgedb/interfaces'
import type {
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

const props = withDefaults(
  defineProps<{
    issues: issue.Issue[]
  }>(),
  {
    issues: () => [] as issue.Issue[],
  },
)
const { d, t } = useI18n()
const data = toRef(props, 'issues')
const columnHelper = createColumnHelper<issue.Issue>()

const columns = [
  columnHelper.display({
    id: 'select',
    maxSize: 1,
    header: ({ table }) =>
      h(
        'div',
        { class: 'capitalize px-2 h-full w-full justify-center text-nowrap bg-accent dark:bg-secondary flex items-center justify-center h-full w-full' },
        h(Checkbox, {
          'role': 'checkbox',
          'class': 'p-0 !pr-0',
          'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
          'onUpdate:checked': value =>
            table.toggleAllPageRowsSelected(Boolean(value)),
        }),
      ),
    enablePinning: true,
    cell: ({ row }) =>
      h(
        'div',
        { class: 'capitalize px-2 h-full w-full justify-center text-nowrap flex items-center justify-center h-full w-full' },
        h(Checkbox, {
          'role': 'checkbox',
          'class': 'p-0 !pr-0',
          'checked': row.getIsSelected(),
          'onUpdate:checked': value => row.toggleSelected(Boolean(value)),
          'ariaLabel': 'Select row',
        }),
      ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor('status', {
    enablePinning: true,
    maxSize: 1,
    header: ({ column }) =>
      h(
        Button,
        {
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          variant: 'secondary',
          class: 'capitalize w-full h-full border-none flex-1 px-4 rounded-none justify-start text-nowrap',
        },
        () => [t('modules.issue.status'), h(CaretSortIcon, { class: 'ml-1' })],
      ),
    cell: ({ row }) =>
      h('div', { class: 'capitalize px-2 flex h-full w-full items-center justify-center text-nowrap' }, [h(Badge, { variant: 'secondary' }, () => row.getValue('status'))]),
  }),
  columnHelper.accessor('name', {
    header: ({ column }) =>
      h(
        Button,
        {
          variant: 'secondary',
          class: 'capitalize w-full h-full border-none flex-1 px-4 rounded-none justify-start text-nowrap',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => [t('modules.issue.name'), h(CaretSortIcon, { class: 'ml-1' } as any)],
      ),
    cell: ({ row }) =>
      h(
        'div',
        {
          class: 'lowercase px-2 text-nowrap w-full',
          onClick: () => row.toggleExpanded(),
        },
        row.getValue('name'),
      ),
  }),
  columnHelper.accessor('updated_at', {
    enableSorting: true,
    header: ({ column }) => h(
      Button,
      {
        variant: 'secondary',
        class: 'capitalize w-full h-full border-none flex-1 px-4 rounded-none justify-start text-nowrap',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [t('modules.issue.updated_at'), h(CaretSortIcon, { class: 'ml-1' } as any)],
    ),
    cell: ({ row }) => {
      const updatedAt = Number.parseFloat(row.getValue('updated_at'))

      // Format the amount as a dollar amount
      const formatted = d(updatedAt)

      return h(
        'div',
        { class: 'w-20 font-light text-right text-nowrap' },
        formatted,
      )
    },
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    maxSize: 1,
    header: () => h(
      'div',
      { class: 'capitalize h-full w-full justify-center text-nowrap bg-accent dark:bg-secondary flex items-center justify-center h-full w-full' },
    ),
    cell: ({ row }) => {
      const issue = row.original

      return h(
        'div',
        { class: 'relative text-right px-2' },
        h(DropdownAction, {
          issue,
          onExpand: row.toggleExpanded,
          expanded: row.getIsExpanded(),
        }),
      )
    },
  }),
]

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

const table = useVueTable({
  data,
  columns,
  debugHeaders: true,
  enableMultiRemove: true,
  enableColumnResizing: true,
  enableMultiRowSelection: true,
  rowCount: data.value.length,
  columnResizeMode: 'onChange',
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue =>
    valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get expanded() {
      return expanded.value
    },
    columnPinning: {
      left: ['status'],
    },
  },
})
</script>

<template>
  <div class="flex items-center gap-2 px-4 pb-4 mt-2 space-x-2">
    <Input
      class="w-full"
      :placeholder="t('pages.index.links.placeholder.filter_titles')"
      :model-value="table.getColumn('name')?.getFilterValue() as string"
      @update:model-value="table.getColumn('name')?.setFilterValue($event)"
    />
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="ml-auto">
          {{ t('pages.index.links.columns') }}
          <ChevronDownIcon class="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          v-for="column in table
            .getAllColumns()
            .filter((column) => column.getCanHide())"
          :key="column.id"
          class="capitalize"
          :checked="column.getIsVisible()"
          @update:checked="
            (value) => {
              column.toggleVisibility(!!value);
            }
          "
        >
          {{ column.id }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <Table>
    <TableHeader>
      <TableRow
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
        class="sticky top-0 z-30 bg-background/95"
      >
        <TableHead
          v-for="header in headerGroup.headers"
          :key="header.id"
          :data-pinned="header.column.getIsPinned()"
          :class="
            cn(
              { 'sticky bg-background/95 z-20': header.column.getIsPinned() },
              header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
            )
          "
        >
          <FlexRender
            v-if="!header.isPlaceholder"
            :render="header.column.columnDef.header"
            :props="header.getContext()"
          />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <template v-if="table.getRowModel().rows?.length">
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <TableRow :data-state="row.getIsSelected() && 'selected'">
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :data-pinned="cell.column.getIsPinned()"
              :class="
                cn(
                  { 'sticky bg-background/95 z-20': cell.column.getIsPinned() },
                  cell.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                )
              "
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
          <TableRow v-if="row.getIsExpanded()">
            <TableCell :colspan="row.getAllCells().length">
              <div class="flex flex-col flex-grow px-4 py-4 bg-secondary/50 dark:bg-accent/75">
                <div class="flex flex-row items-center justify-between gap-2">
                  <H2 class="text-2xl">
                    {{ row.original.name }}
                  </H2>
                  <Badge v-if="row.original.priority" variant="outline">
                    {{ row.original.priority }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ row.original.id }}
                </p>
              </div>
            </TableCell>
          </TableRow>
        </template>
      </template>

      <TableRow v-else>
        <TableCell :colspan="columns.length" class="h-40 text-center ">
          {{ t('pages.index.links.no_results') }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <div
    class="flex flex-row items-center justify-between p-4 space-x-2 border-t"
  >
    <div class="text-sm text-muted-foreground">
      {{ t('modules.issue.plurals.issue', table.getFilteredSelectedRowModel().rows.length) }}
    </div>
    <div class="flex flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        {{ t('pages.index.links.previous') }}
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        {{ t('pages.index.links.next') }}
      </Button>
    </div>
  </div>
</template>
