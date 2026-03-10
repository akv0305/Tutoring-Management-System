"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ColumnDef<T extends Record<string, unknown>> = {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

type DataTableProps<T extends Record<string, unknown>> = {
  columns: ColumnDef<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  selectable?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
}

type SortDirection = "asc" | "desc" | null

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize: initialPageSize = 10,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      )
    )
  }, [data, searchQuery])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const aStr = String(av ?? "")
      const bStr = String(bv ?? "")
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true })
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
        )
        if (sortDir === "desc") setSortKey(null)
      } else {
        setSortKey(key)
        setSortDir("asc")
      }
      setCurrentPage(1)
    },
    [sortKey, sortDir]
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Selection
  const allPageIds = paginated.map((row) => String((row as Record<string, unknown>).id ?? ""))
  const allPageSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id))
  const somePageSelected = allPageIds.some((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (allPageSelected) {
      allPageIds.forEach((id) => next.delete(id))
    } else {
      allPageIds.forEach((id) => next.add(id))
    }
    setSelectedIds(next)
    onSelectionChange?.(Array.from(next))
  }

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    onSelectionChange?.(Array.from(next))
  }

  const startItem = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, sorted.length)

  const renderPageButtons = () => {
    const buttons: React.ReactNode[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)

    for (let p = start; p <= end; p++) {
      buttons.push(
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={cn(
            "w-8 h-8 rounded-md text-sm font-medium transition-colors",
            p === currentPage
              ? "bg-[#1E3A5F] text-white"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {p}
        </button>
      )
    }
    return buttons
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline" />
    if (sortDir === "asc")
      return <ChevronUp className="w-3.5 h-3.5 text-[#1E3A5F] ml-1 inline" />
    return <ChevronDown className="w-3.5 h-3.5 text-[#1E3A5F] ml-1 inline" />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
        {searchable && (
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-400 mr-1">Rows:</span>
          {PAGE_SIZE_OPTIONS.map((size, i) => (
            <React.Fragment key={size}>
              {i > 0 && <span className="text-gray-300 text-xs">|</span>}
              <button
                onClick={() => handlePageSizeChange(size)}
                className={cn(
                  "px-2 py-1 text-xs rounded font-medium transition-colors",
                  pageSize === size
                    ? "bg-[#1E3A5F] text-white"
                    : "text-gray-500 hover:text-[#1E3A5F]"
                )}
              >
                {size}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-gray-50/80">
            {selectable && (
              <TableHead className="w-10 pr-0">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAll}
                  ref={null}
                  aria-label="Select all"
                  data-state={somePageSelected && !allPageSelected ? "indeterminate" : undefined}
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead key={col.key}>
                {col.sortable ? (
                  <button
                    className="flex items-center font-medium text-gray-500 text-xs uppercase tracking-wide hover:text-[#1E3A5F] transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </button>
                ) : (
                  <span className="text-xs uppercase tracking-wide font-medium text-gray-500">
                    {col.label}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="text-center py-12 text-gray-400"
              >
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((row, idx) => {
              const rowId = String((row as Record<string, unknown>).id ?? idx)
              const isSelected = selectedIds.has(rowId)
              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    idx % 2 === 1 ? "bg-gray-50/60" : "bg-white",
                    isSelected && "!bg-blue-50"
                  )}
                >
                  {selectable && (
                    <TableCell className="pr-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectRow(rowId)}
                        aria-label={`Select row ${rowId}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className="py-3">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-wrap gap-2">
        <p className="text-xs text-gray-400">
          {sorted.length === 0
            ? "No results"
            : `Showing ${startItem}–${endItem} of ${sorted.length} results`}
          {selectedIds.size > 0 && (
            <span className="ml-2 text-[#1E3A5F] font-medium">
              ({selectedIds.size} selected)
            </span>
          )}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {renderPageButtons()}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
