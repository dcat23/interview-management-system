import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  MoreHorizontal,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@app/dashboard/components/ui/common/alert-dialog"
import { Button } from "@app/dashboard/components/ui/common/button"
import { Checkbox } from "@app/dashboard/components/ui/common/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@app/dashboard/components/ui/common/dropdown-menu"
import { Input } from "@app/dashboard/components/ui/common/input"
import { Label } from "@app/dashboard/components/ui/common/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/dashboard/components/ui/common/select"
import { Skeleton } from "@app/dashboard/components/ui/common/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@app/dashboard/components/ui/common/table"
import { generateThreeWordGuard } from "@app/dashboard/lib/ui/typed-guard"

export type DataTableColumn<TData> = {
  id: string
  header: ReactNode
  cell: (row: TData) => ReactNode
  sortValue?: (row: TData) => string | number | null | undefined
  sortable?: boolean
  className?: string
  width?: string
  exportHeader?: string
  exportValue?: (row: TData) => string | number | null | undefined
  exportable?: boolean
}

export type DataTableRowAction<TData> = {
  label: string
  onClick: (row: TData) => void | Promise<void>
  icon?: ReactNode
  tone?: "default" | "warning" | "destructive"
  destructive?: boolean
  disabled?: boolean
  confirmTitle?: string
  confirmDescription?: string
  confirmKeyword?: string
  confirmKeywordMode?: "fixed" | "random-3-words"
}

export type DataTableRowActionGroup<TData> = {
  label?: string
  actions: DataTableRowAction<TData>[]
}

type SortDirection = "asc" | "desc"
export type DataTableSortState = {
  columnId: string
  direction: SortDirection
} | null

export type DataTableToolbarContext<TData> = {
  selectedRows: TData[]
  filteredRows: TData[]
  exportRows: TData[]
  exportCsv: (fileName?: string) => void
  clearSelection: () => void
}

export type DataTableServerPagination = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

type DataTableProps<TData> = {
  columns: DataTableColumn<TData>[]
  data: TData[]
  getRowId: (row: TData) => string
  emptyMessage?: string
  enableRowSelection?: boolean
  enableSorting?: boolean
  rowActions?: (row: TData) => DataTableRowAction<TData>[]
  rowActionGroups?: (row: TData) => DataTableRowActionGroup<TData>[]
  enableRowReordering?: boolean
  onRowOrderChange?: (rows: TData[]) => void
  toolbarActions?: (context: DataTableToolbarContext<TData>) => ReactNode
  selectionActions?: (context: DataTableToolbarContext<TData>) => ReactNode
  searchPlaceholder?: string
  searchableText?: (row: TData) => string
  exportFileName?: string
  isLoading?: boolean
  skeletonRows?: number
  enablePagination?: boolean
  pageSizeOptions?: number[]
  defaultPageSize?: number
  serverPagination?: DataTableServerPagination
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  sortState?: DataTableSortState
  onSortStateChange?: (state: DataTableSortState) => void
}

function compareValues(
  left: string | number | null | undefined,
  right: string | number | null | undefined
) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1

  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.split('"').join('""')}"`
  }
  return value
}

function formatTableNumber(value: number) {
  return value.toLocaleString()
}

function formatCellValue(value: ReactNode): ReactNode {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatTableNumber(value)
  }
  if (typeof value === "bigint") {
    return value.toLocaleString()
  }
  return value
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  emptyMessage = "No results.",
  enableRowSelection = false,
  enableSorting = false,
  rowActions,
  rowActionGroups,
  enableRowReordering = false,
  onRowOrderChange,
  toolbarActions,
  selectionActions,
  searchPlaceholder = "Search",
  searchableText,
  exportFileName = "export.csv",
  isLoading = false,
  skeletonRows = 6,
  enablePagination = true,
  pageSizeOptions = [5, 10, 15, 20, 50],
  defaultPageSize = 5,
  serverPagination,
  searchValue,
  onSearchValueChange,
  sortState,
  onSortStateChange,
}: DataTableProps<TData>) {
  const [search, setSearch] = useState(searchValue ?? "")
  const [internalSortState, setInternalSortState] =
    useState<DataTableSortState>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  )
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<{
    row: TData
    action: DataTableRowAction<TData>
  } | null>(null)
  const [confirmKeywordInput, setConfirmKeywordInput] = useState("")
  const [confirmKeywordValue, setConfirmKeywordValue] = useState("DELETE")
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null)
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const serverPaginationState = serverPagination ?? null
  const isServerPagination = Boolean(serverPaginationState)
  const effectiveSortState = sortState ?? internalSortState

  useEffect(() => {
    if (searchValue === undefined) return
    setSearch(searchValue)
  }, [searchValue])

  const activeSearch = searchValue ?? search

  const filteredData = useMemo(() => {
    if (isServerPagination) {
      return data
    }

    const query = activeSearch.trim().toLowerCase()
    if (!query || !searchableText) {
      return data
    }

    return data.filter((row) =>
      searchableText(row).toLowerCase().includes(query)
    )
  }, [activeSearch, data, isServerPagination, searchableText])

  const sortedData = useMemo(() => {
    if (isServerPagination) {
      return filteredData
    }

    if (!effectiveSortState) {
      return filteredData
    }

    const column = columns.find(
      (item) => item.id === effectiveSortState.columnId
    )
    if (!column?.sortValue) {
      return filteredData
    }

    const direction = effectiveSortState.direction === "asc" ? 1 : -1
    return [...filteredData].sort(
      (left, right) =>
        direction *
        compareValues(column.sortValue?.(left), column.sortValue?.(right))
    )
  }, [columns, effectiveSortState, filteredData, isServerPagination])

  const totalRows = serverPaginationState
    ? serverPaginationState.total
    : sortedData.length
  const currentPageSize = serverPaginationState
    ? serverPaginationState.pageSize
    : pageSize
  const effectiveSkeletonRows = isServerPagination
    ? currentPageSize
    : skeletonRows
  const pageCount = Math.max(1, Math.ceil(totalRows / currentPageSize))
  const effectivePageIndex = serverPaginationState
    ? Math.min(Math.max(serverPaginationState.page - 1, 0), pageCount - 1)
    : Math.min(pageIndex, pageCount - 1)
  const pagedData = useMemo(() => {
    if (isServerPagination) {
      return sortedData
    }
    if (!enablePagination) {
      return sortedData
    }
    const start = effectivePageIndex * currentPageSize
    const end = start + currentPageSize
    return sortedData.slice(start, end)
  }, [
    currentPageSize,
    effectivePageIndex,
    enablePagination,
    isServerPagination,
    sortedData,
  ])

  useEffect(() => {
    if (isServerPagination) {
      return
    }
    if (!enablePagination) {
      setPageIndex(0)
      return
    }
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0))
    }
  }, [enablePagination, isServerPagination, pageCount, pageIndex])

  useEffect(() => {
    if (isServerPagination) {
      return
    }
    setPageIndex(0)
  }, [isServerPagination, activeSearch, effectiveSortState, pageSize])

  const selectedRows = useMemo(
    () => data.filter((row) => selectedRowIds[getRowId(row)]),
    [data, getRowId, selectedRowIds]
  )

  const exportRows = useMemo(() => {
    if (selectedRows.length > 0) {
      return selectedRows
    }
    if (activeSearch.trim().length > 0) {
      return filteredData
    }
    return data
  }, [activeSearch, data, filteredData, selectedRows])

  const allVisibleRowsSelected =
    pagedData.length > 0 &&
    pagedData.every((row) => selectedRowIds[getRowId(row)])
  const someVisibleRowsSelected =
    !allVisibleRowsSelected &&
    pagedData.some((row) => selectedRowIds[getRowId(row)])

  const exportableColumns = useMemo(
    () => columns.filter((column) => column.exportable !== false),
    [columns]
  )

  function clearSelection() {
    setSelectedRowIds({})
  }

  function downloadCsv(fileName: string, rows: TData[]) {
    const header = exportableColumns
      .map((column) =>
        csvEscape(String(column.exportHeader ?? column.header ?? column.id))
      )
      .join(",")

    const lines = rows.map((row) => {
      return exportableColumns
        .map((column) => {
          const raw = column.exportValue
            ? column.exportValue(row)
            : column.sortValue
              ? column.sortValue(row)
              : ""
          return csvEscape(raw == null ? "" : String(raw))
        })
        .join(",")
    })

    const csv = [header, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportCsv(fileName = exportFileName) {
    downloadCsv(fileName, exportRows)
  }

  const context: DataTableToolbarContext<TData> = {
    selectedRows,
    filteredRows: filteredData,
    exportRows,
    exportCsv,
    clearSelection,
  }

  function toggleSort(column: DataTableColumn<TData>) {
    const canSortColumn = isServerPagination
      ? Boolean(column.sortable)
      : Boolean(column.sortable && column.sortValue)
    if (!enableSorting || !canSortColumn) {
      return
    }

    const nextSortState: DataTableSortState =
      !effectiveSortState || effectiveSortState.columnId !== column.id
        ? { columnId: column.id, direction: "asc" }
        : effectiveSortState.direction === "asc"
          ? { columnId: column.id, direction: "desc" }
          : null

    if (sortState === undefined) {
      setInternalSortState(nextSortState)
    }
    onSortStateChange?.(nextSortState)
  }

  function reorderRows(activeRowId: string, overRowId: string) {
    if (activeRowId === overRowId) {
      return
    }

    const activeIndex = data.findIndex((row) => getRowId(row) === activeRowId)
    const overIndex = data.findIndex((row) => getRowId(row) === overRowId)

    if (activeIndex === -1 || overIndex === -1) {
      return
    }

    const nextRows = [...data]
    const [activeRow] = nextRows.splice(activeIndex, 1)
    nextRows.splice(overIndex, 0, activeRow)
    onRowOrderChange?.(nextRows)
  }

  function handleRowDragStart(event: DragEvent<HTMLButtonElement>, row: TData) {
    const rowId = getRowId(row)
    setDraggedRowId(rowId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", rowId)
  }

  function handleRowDrop(event: DragEvent<HTMLTableRowElement>, row: TData) {
    event.preventDefault()
    const activeRowId = event.dataTransfer.getData("text/plain") || draggedRowId

    if (activeRowId) {
      reorderRows(activeRowId, getRowId(row))
    }

    setDraggedRowId(null)
    setDragOverRowId(null)
  }

  const destructiveKeyword = confirmKeywordValue

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <div className="sm:flex sm:flex-1 sm:justify-center">
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="table-fixed">
            <colgroup>
              {enableRowSelection ? <col style={{ width: "2.5rem" }} /> : null}
              {enableRowReordering ? <col style={{ width: "2.5rem" }} /> : null}
              {columns.map((column) => (
                <col
                  key={`skeleton-col-${column.id}`}
                  style={
                    column.width
                      ? { width: column.width, minWidth: column.width }
                      : undefined
                  }
                />
              ))}
              <col style={{ width: "5rem", minWidth: "5rem" }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                {enableRowSelection ? (
                  <TableHead className="w-10">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                ) : null}
                {enableRowReordering ? <TableHead className="w-10" /> : null}
                {columns.map((column) => (
                  <TableHead key={column.id} className={column.className}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 w-20 bg-card pr-2 text-right">
                  <Skeleton className="ml-auto h-4 w-12" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: effectiveSkeletonRows }).map(
                (_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    {enableRowSelection ? (
                      <TableCell className="w-10">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    ) : null}
                    {enableRowReordering ? (
                      <TableCell className="w-10">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell
                        key={`skeleton-cell-${rowIndex}-${column.id}`}
                        className={column.className}
                      >
                        <Skeleton className="h-5 w-full max-w-40" />
                      </TableCell>
                    ))}
                    <TableCell className="sticky right-0 bg-card text-right">
                      <Skeleton className="ml-auto h-8 w-8" />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={activeSearch}
            onChange={(event) => {
              const value = event.target.value
              if (onSearchValueChange) {
                onSearchValueChange(value)
                return
              }
              setSearch(value)
            }}
            placeholder={searchPlaceholder}
            className="w-full sm:max-w-sm"
          />

          {selectedRows.length > 0 ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {formatTableNumber(selectedRows.length)} selected
                </span>
                {selectionActions?.(context)}
              </div>
            </div>
          ) : null}

          <div className="hidden sm:block sm:flex-1" />

          {toolbarActions ? (
            <div className="max-w-full min-w-0 overflow-x-auto sm:overflow-visible">
              <div className="flex w-max max-w-full items-center gap-2">
                {toolbarActions(context)}
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="table-fixed">
            <colgroup>
              {enableRowSelection ? <col style={{ width: "2.5rem" }} /> : null}
              {enableRowReordering ? <col style={{ width: "2.5rem" }} /> : null}
              {columns.map((column) => (
                <col
                  key={`col-${column.id}`}
                  style={
                    column.width
                      ? { width: column.width, minWidth: column.width }
                      : undefined
                  }
                />
              ))}
              <col style={{ width: "5rem", minWidth: "5rem" }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                {enableRowSelection ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allVisibleRowsSelected ||
                        (someVisibleRowsSelected ? "indeterminate" : false)
                      }
                      onCheckedChange={(checked) => {
                        const value = Boolean(checked)
                        setSelectedRowIds((prev) => {
                          const next = { ...prev }
                          for (const row of pagedData) {
                            next[getRowId(row)] = value
                          }
                          return next
                        })
                      }}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                ) : null}
                {enableRowReordering ? <TableHead className="w-10" /> : null}

                {columns.map((column) => {
                  const isSorted = effectiveSortState?.columnId === column.id
                  const canSortColumn = isServerPagination
                    ? Boolean(column.sortable)
                    : Boolean(column.sortable && column.sortValue)

                  return (
                    <TableHead key={column.id} className={column.className}>
                      {enableSorting && canSortColumn ? (
                        <Button
                          variant="ghost"
                          className="-ml-2 h-8 px-2"
                          onClick={() => toggleSort(column)}
                        >
                          {column.header}
                          {isSorted ? (
                            effectiveSortState?.direction === "asc" ? (
                              <ArrowUp className="ml-1 size-3.5" />
                            ) : (
                              <ArrowDown className="ml-1 size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="ml-1 size-3.5" />
                          )}
                        </Button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  )
                })}

                <TableHead className="sticky right-0 w-20 bg-card pr-2 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pagedData.length > 0 ? (
                pagedData.map((row) => {
                  const rowId = getRowId(row)
                  const groups = rowActionGroups
                    ? rowActionGroups(row)
                    : rowActions
                      ? [{ actions: rowActions(row) }]
                      : []

                  return (
                    <TableRow
                      key={rowId}
                      data-state={
                        selectedRowIds[rowId] ? "selected" : undefined
                      }
                      data-dragging={
                        draggedRowId === rowId ? "true" : undefined
                      }
                      data-drag-over={
                        dragOverRowId === rowId ? "true" : undefined
                      }
                      className="group data-[drag-over=true]:bg-muted/60 data-[dragging=true]:opacity-50"
                      onDragOver={(event) => {
                        if (!enableRowReordering || !draggedRowId) {
                          return
                        }
                        event.preventDefault()
                        event.dataTransfer.dropEffect = "move"
                        setDragOverRowId(rowId)
                      }}
                      onDragLeave={() => {
                        if (dragOverRowId === rowId) {
                          setDragOverRowId(null)
                        }
                      }}
                      onDrop={(event) => handleRowDrop(event, row)}
                    >
                      {enableRowSelection ? (
                        <TableCell className="w-10">
                          <Checkbox
                            checked={Boolean(selectedRowIds[rowId])}
                            onCheckedChange={(checked) => {
                              const value = Boolean(checked)
                              setSelectedRowIds((prev) => ({
                                ...prev,
                                [rowId]: value,
                              }))
                            }}
                            aria-label={`Select row ${rowId}`}
                          />
                        </TableCell>
                      ) : null}
                      {enableRowReordering ? (
                        <TableCell className="w-10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            draggable
                            onDragStart={(event) =>
                              handleRowDragStart(event, row)
                            }
                            onDragEnd={() => {
                              setDraggedRowId(null)
                              setDragOverRowId(null)
                            }}
                            className="h-7 w-7 cursor-grab text-muted-foreground active:cursor-grabbing"
                            aria-label={`Reorder row ${rowId}`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      ) : null}

                      {columns.map((column) => (
                        <TableCell
                          key={`${rowId}:${column.id}`}
                          className={column.className}
                        >
                          {formatCellValue(column.cell(row))}
                        </TableCell>
                      ))}

                      <TableCell className="sticky right-0 bg-card text-right group-data-[state=selected]:bg-muted">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {groups.length > 0 ? (
                              groups.map((group, groupIndex) => (
                                <div
                                  key={`${rowId}:group:${group.label ?? groupIndex}`}
                                >
                                  {group.label ? (
                                    <DropdownMenuLabel>
                                      {group.label}
                                    </DropdownMenuLabel>
                                  ) : null}
                                  {group.actions.map((action) => (
                                    <DropdownMenuItem
                                      key={`${rowId}:${action.label}`}
                                      disabled={action.disabled}
                                      variant={
                                        action.tone === "destructive" ||
                                        action.destructive
                                          ? "destructive"
                                          : "default"
                                      }
                                      className={
                                        action.tone === "destructive" ||
                                        action.destructive
                                          ? "my-0.5 bg-destructive/10 font-medium text-destructive! focus:bg-destructive/15 focus:text-destructive! dark:bg-destructive/20 dark:focus:bg-destructive/30 [&_svg]:text-destructive!"
                                          : "my-0.5"
                                      }
                                      onSelect={(event) => {
                                        event.preventDefault()
                                        if (
                                          action.destructive ||
                                          action.tone === "destructive"
                                        ) {
                                          setPendingDestructiveAction({
                                            row,
                                            action,
                                          })
                                          setConfirmKeywordInput("")
                                          setConfirmKeywordValue(
                                            action.confirmKeywordMode ===
                                              "random-3-words"
                                              ? generateThreeWordGuard()
                                              : (action.confirmKeyword ??
                                                  "DELETE")
                                          )
                                          return
                                        }
                                        void action.onClick(row)
                                      }}
                                    >
                                      {action.icon ? (
                                        <span className="shrink-0">
                                          {action.icon}
                                        </span>
                                      ) : null}
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                                  {groupIndex < groups.length - 1 ? (
                                    <DropdownMenuSeparator />
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <DropdownMenuItem disabled>
                                No actions
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      1 +
                      (enableRowSelection ? 1 : 0) +
                      (enableRowReordering ? 1 : 0)
                    }
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {enablePagination ? (
          <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {totalRows === 0
                ? "No rows"
                : `Showing ${formatTableNumber(
                    effectivePageIndex * currentPageSize + 1
                  )}-${formatTableNumber(
                    Math.min(
                      (effectivePageIndex + 1) * currentPageSize,
                      totalRows
                    )
                  )} of ${formatTableNumber(totalRows)}`}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <Label
                  htmlFor="rows-per-page"
                  className="text-xs text-muted-foreground"
                >
                  Rows per page
                </Label>
                <Select
                  value={String(currentPageSize)}
                  onValueChange={(value) => {
                    const nextSize = Number(value)
                    if (serverPaginationState) {
                      serverPaginationState.onPageSizeChange(nextSize)
                      return
                    }
                    setPageSize(nextSize)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger id="rows-per-page" className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {formatTableNumber(effectivePageIndex + 1)} of{" "}
                {formatTableNumber(pageCount)}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (serverPaginationState) {
                      serverPaginationState.onPageChange(1)
                      return
                    }
                    setPageIndex(0)
                  }}
                  disabled={effectivePageIndex === 0}
                >
                  <span className="sr-only">First page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (serverPaginationState) {
                      serverPaginationState.onPageChange(
                        Math.max(serverPaginationState.page - 1, 1)
                      )
                      return
                    }
                    setPageIndex((prev) => Math.max(prev - 1, 0))
                  }}
                  disabled={effectivePageIndex === 0}
                >
                  <span className="sr-only">Previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (serverPaginationState) {
                      serverPaginationState.onPageChange(
                        Math.min(serverPaginationState.page + 1, pageCount)
                      )
                      return
                    }
                    setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                  }}
                  disabled={effectivePageIndex >= pageCount - 1}
                >
                  <span className="sr-only">Next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (serverPaginationState) {
                      serverPaginationState.onPageChange(pageCount)
                      return
                    }
                    setPageIndex(pageCount - 1)
                  }}
                  disabled={effectivePageIndex >= pageCount - 1}
                >
                  <span className="sr-only">Last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={Boolean(pendingDestructiveAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDestructiveAction(null)
            setConfirmKeywordInput("")
            setConfirmKeywordValue("DELETE")
          }
        }}
      >
        <AlertDialogContent className="w-[min(calc(100vw-2rem),34rem)] max-w-lg border ring-0">
          <AlertDialogHeader className="place-items-stretch text-left">
            <AlertDialogTitle>
              {pendingDestructiveAction?.action.confirmTitle ??
                "Confirm destructive action"}
            </AlertDialogTitle>
            <AlertDialogDescription className="w-full space-y-3">
              <p>
                {pendingDestructiveAction?.action.confirmDescription ??
                  "Type the verification phrase below to confirm this action."}
              </p>
              <div className="w-full rounded-md bg-muted px-3 py-3 text-center font-mono text-sm text-foreground">
                {destructiveKeyword}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            className="w-full focus-visible:border-input focus-visible:ring-0"
            value={confirmKeywordInput}
            onChange={(event) => setConfirmKeywordInput(event.target.value)}
            placeholder={`Type ${destructiveKeyword}`}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmKeywordInput !== destructiveKeyword}
              onClick={() => {
                if (
                  !pendingDestructiveAction ||
                  confirmKeywordInput !== destructiveKeyword
                ) {
                  return
                }
                void pendingDestructiveAction.action.onClick(
                  pendingDestructiveAction.row
                )
                setPendingDestructiveAction(null)
                setConfirmKeywordInput("")
                setConfirmKeywordValue("DELETE")
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
