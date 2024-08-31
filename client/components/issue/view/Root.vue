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
import { h, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, valueUpdater } from '@/lib/utils'

import ActionsHeader from '~/components/issue/view/ActionsHeader.vue'
import ExpandedRowContent from '~/components/issue/view/ExpandedRowContent.vue'
import NameCell from '~/components/issue/view/NameCell.vue'
import NameHeader from '~/components/issue/view/NameHeader.vue'
import SelectCell from '~/components/issue/view/SelectCell.vue'
import SelectHeader from '~/components/issue/view/SelectHeader.vue'
import StatusCell from '~/components/issue/view/StatusCell.vue'
import StatusHeader from '~/components/issue/view/StatusHeader.vue'
import UpdatedAtCell from '~/components/issue/view/UpdatedAtCell.vue'
import UpdatedAtHeader from '~/components/issue/view/UpdatedAtHeader.vue'

import Action from './Actions.vue'

import type { issue } from '#edgedb/interfaces'
import type {
  ColumnFiltersState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
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

const { t } = useI18n()

const data = toRef(props, 'issues')
const columnHelper = createColumnHelper<issue.Issue>()
const columns = [
  columnHelper.display({
    id: 'select',
    enableHiding: false,
    enablePinning: true,
    enableSorting: false,
    enableGrouping: true,
    minSize: 0,
    maxSize: 2,
    size: 0,
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
    enableHiding: false,
    enablePinning: true,
    minSize: 0,
    maxSize: 2,
    size: 0,
    header: ({ column }) =>
      h(StatusHeader, {
        onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) =>
      h(StatusCell, {
        status: row.getValue('status'),
      }),
  }),
  columnHelper.accessor('name', {
    enableHiding: false,
    enableSorting: true,
    minSize: 60,
    size: 80,
    maxSize: 100,
    header: ({ column }) =>
      h(NameHeader, {
        onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) =>
      h(NameCell, {
        name: row.getValue('name'),
        onToggleExpanded: () => row.toggleExpanded(),
      }),
  }),
  columnHelper.accessor('updated_at', {
    enableHiding: true,
    enableSorting: true,
    minSize: 0,
    maxSize: 2,
    size: 0,
    header: ({ column }) =>
      h(UpdatedAtHeader, {
        onToggleSort: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) =>
      h(UpdatedAtCell, {
        updatedAt: Number.parseFloat(row.getValue('updated_at')),
      }),
  }),
  columnHelper.display({
    id: 'actions',
    minSize: 0,
    maxSize: 2,
    size: 0,
    header: () => h(ActionsHeader),
    cell: ({ row }) => {
      const issue = row.original

      return h(
        'div',
        { class: 'relative text-right px-2' },
        h(Action, {
          issue,
          onExpand: row.toggleExpanded,
          expanded: row.getIsExpanded(),
        }),
      )
    },
  }),
]

const sorting = ref<SortingState>([])
const columnSizing = ref<ColumnSizingState>({})
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const expanded = ref<ExpandedState>({})
const rowSelection = ref<RowSelectionState>({})
const pagination = ref<PaginationState>({
  pageIndex: 1,
  pageSize: 30,
})

const totalRowCount = ref(0)

const table = useVueTable({
  columns,
  keepPinnedRows: true,
  manualPagination: false,
  enableMultiRemove: true,
  enableRowPinning: true,
  enableRowSelection: true,
  enableMultiRowSelection: true,

  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),

  onPaginationChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, pagination)
    totalRowCount.value = table.getRowModel().rows.length
  },
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
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
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),

  get data() {
    return data.value
  },
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
      return {
        top: ['header-1'],
      }
    },
    get columnPinning() {
      return {
        left: ['select', 'status'],
        right: ['actions'],
      }
    },
  },
})
</script>

<template>
  <Table>
    <TableHeader class="sticky top-0 z-30">
      <TableRow
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
        class="sticky top-0 z-30"
      >
        <TableHead
          v-for="header in headerGroup.headers"
          :key="header.id"
          :pinned="header.column.getIsPinned()"
          class="sticky top-0 z-30"
        >
          <FlexRender
            v-if="!header.isPlaceholder"
            :render="header.column.columnDef.header"
            :props="header.getContext()"
          />
        </TableHead>
      </TableRow>
    </TableHeader>
    <template v-if="table.getRowModel().rows?.length">
      <TableBody>
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <TableRow
            :data-state="row.getIsSelected() && 'selected'"
            :data-pinned="row.getIsPinned()"
          >
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :pinned="cell.column.getIsPinned()"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
          <TableRow v-if="row.getIsExpanded()">
            <TableCell :colspan="row.getAllCells().length">
              <ExpandedRowContent :issue="row.original" />
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </template>

    <TableBody v-else>
      <TableRow>
        <TableCell :colspan="columns.length" class="p-4 text-center">
          {{ t("pages.index.links.no_results") }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
