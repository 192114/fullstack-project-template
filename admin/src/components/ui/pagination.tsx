import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  current: number
  total: number
  totalPages: number
  pageSize?: number
  onPageChange: (page: number) => void
}

/** Build page number list with ellipsis */
function buildPageList(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function Pagination({
  current,
  total,
  totalPages,
  pageSize = 10,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageList(current, totalPages)

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="text-sm text-gray-500">共 {total} 条数据</span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1.5 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'flex min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition-colors',
                page === current
                  ? 'border-primary bg-primary/5 font-medium text-primary'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {page}
            </button>
          ),
        )}
        <button
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
        <span className="ml-2 text-sm text-gray-400">{pageSize} 条/页</span>
      </div>
    </div>
  )
}
