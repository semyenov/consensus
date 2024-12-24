<script setup lang="ts">
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
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, h, ref } from 'vue'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { valueUpdater } from '@/lib/utils'

import type ScrollArea from '~/components/ui/scroll-area/ScrollArea.vue'

import ActionsCell from './ActionsCell.vue'
import ActionsHeader from './ActionsHeader.vue'
import ExpandedRowContent from './ExpandedRowContent.vue'
import NameCell from './NameCell.vue'
import NameHeader from './NameHeader.vue'
import SelectCell from './SelectCell.vue'
import SelectHeader from './SelectHeader.vue'
import StatusCell from './StatusCell.vue'
import StatusHeader from './StatusHeader.vue'
import UpdatedAtCell from './UpdatedAtCell.vue'
import UpdatedAtHeader from './UpdatedAtHeader.vue'

import type { issue } from '#edgedb/interfaces'
import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowPinningState,
  RowSelectionState,
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

const data = toRef(props, 'issues')
const columnHelper = createColumnHelper<issue.Issue>()

const sorting = ref<SortingState>([])
const columnSizing = ref<ColumnSizingState>({})
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const columnPinning = ref<ColumnPinningState>({
  left: ['select', 'status'],
  right: ['actions'],
})
const rowPinning = ref<RowPinningState>({})
const expanded = ref<ExpandedState>({})
const rowSelection = ref<RowSelectionState>({})
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: data.value.length,
})

const tableContainerRef = ref<HTMLElement | null>(null)
const rowVirtualizer = useVirtualizer({
  count: data.value.length,
  getScrollElement: () => tableContainerRef.value,
  measureElement: element =>
  // console.log('element', element)

    element?.getBoundingClientRect().height,
  estimateSize: () => 36,
  overscan: 10,
})

const table = useVueTable({
  defaultColumn: {
    size: 1,
    enableHiding: true,
    enablePinning: true,
    enableResizing: true,
    enableSorting: true,
  },

  keepPinnedRows: true,
  manualPagination: false,
  enableMultiRemove: true,
  enableRowPinning: true,
  enableRowSelection: true,
  enableColumnResizing: true,
  enableColumnPinning: true,
  enableMultiRowSelection: true,

  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),

  onSortingChange: updaterOrValue =>
    valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue =>
    valueUpdater(updaterOrValue, rowSelection),
  onColumnSizingChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnSizing),
  onColumnSizingInfoChange: updaterOrValue =>
    valueUpdater(updaterOrValue, columnSizing),
  onExpandedChange: updaterOrValue =>
    valueUpdater(updaterOrValue, expanded),

  get data() {
    return data.value
  },

  columns: [
    columnHelper.display({
      id: 'select',
      enableHiding: false,
      enablePinning: true,
      enableSorting: false,

      header: ({ table }) =>
        h(SelectHeader, {
          'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
          'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(value),
        }),
      cell: ({ row }) =>
        h(SelectCell, {
          'checked': row.getIsSelected(),
          'onUpdate:checked': (value: boolean) => row.toggleSelected(Boolean(value)),
        }),
    }),
    columnHelper.accessor('status', {
      id: 'status',

      header: ({ column }) =>
        h(StatusHeader, {
          onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }),
      cell: ({ row }) =>
        h(StatusCell, {
          ...row.original,
        }),
    }),
    columnHelper.accessor('name', {
      id: 'name',
      enableHiding: false,

      size: 97,
      minSize: 97,
      maxSize: 100,

      header: ({ column }) =>
        h(NameHeader, {
          onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }),
      cell: ({ row }) =>
        h(NameCell, {
          ...row.original,
          onToggleExpanded: () => row.toggleExpanded(),
        }),
    }),
    columnHelper.accessor('updated_at', {
      id: 'updated_at',

      header: ({ column }) =>
        h(UpdatedAtHeader, {
          onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }),
      cell: ({ row }) =>
        h(UpdatedAtCell, {
          updatedAt: new Date(row.original.updated_at),
        }),
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,

      header: () => h(ActionsHeader),
      cell: ({ row }) => {
        const issue = row.original

        return h(ActionsCell, {
          issue,
          onExpand: row.toggleExpanded,
          expanded: row.getIsExpanded(),
        })
      },
    }),
  ],

  state: {
    get pagination() {
      return pagination.value
    },
    get columnSizing() {
      return columnSizing.value
    },
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
    get rowPinning() {
      return rowPinning.value
    },
    get columnPinning() {
      return columnPinning.value
    },
  },
})

const rows = computed(() => table.getRowModel().rows)
</script>

<template>
  <div ref="tableContainerRef" class="flex w-full h-full overflow-auto">
    <Table class="flex-1">
      <!-- <TableCaption>{{ t("pages.index.table.caption") }}</TableCaption> -->
      <TableHeader class="sticky top-0 z-10 flex flex-col w-full">
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="sticky top-0 flex flex-row"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="flex flex-col justify-center p-0"
            :pinned="header.column.getIsPinned()"
            :data-index="header.index"
            :style="{
              width: `${header.column.getSize()}%`,
            }"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              class="flex-1"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody class="flex-1" :style="{ height: `${rowVirtualizer.getTotalSize()}px` }">
        <template v-for="(virtualRow, index) in rowVirtualizer.getVirtualItems()" :key="virtualRow.key">
          <div
            :ref="el => rowVirtualizer.measureElement(el as Element)"
            class="flex flex-row"
            :data-state="rows[virtualRow.index].getIsSelected() && 'selected'"
            :pinned="rows[virtualRow.index].getIsPinned()"
            :data-index="virtualRow.index"
            :style="{
              height: `${virtualRow.size}px`,
              transform: `translateY(${
                virtualRow.start - index * virtualRow.size
              }px)`,
            }"
          >
            <TableCell
              v-for="cell in rows[virtualRow.index].getVisibleCells()"
              :key="cell.id"
              class="flex flex-col justify-center"
              :pinned="cell.column.getIsPinned()"
              :data-index="virtualRow.index"
              :style="{
                height: `${virtualRow.size}px`,
                width: `${cell.column.getSize()}%`,
              }"
            >
              <FlexRender
                class="flex-1"
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </div>
          <TableRow
            v-if="rows[virtualRow.index].getIsExpanded()" :style="{
              height: `${virtualRow.size}px`,
              transform: `translateY(${
                virtualRow.start - index * virtualRow.size
              }px)`,
            }"
          >
            <TableCell :colspan="rows[virtualRow.index].getAllCells().length">
              <ExpandedRowContent :issue="rows[virtualRow.index].original" />
            </TableCell>
          </TableRow>
        </template>
        <TableRow :style="{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems().map(item => item.size).reduce((acc, curr) => acc + curr, 0)}px` }" />
      </TableBody>
    </Table>
  </div>
</template>

<style scoped>
.v-virtual-scroll {
  position: relative;
  overflow-y: auto;
}
</style>
