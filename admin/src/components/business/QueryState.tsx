import { Loader2, Inbox, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  onRetry?: () => void
  minHeight?: string
  emptyMessage?: string
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  minHeight = '200px',
  emptyMessage = '暂无数据',
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight }}
        role="status"
        aria-label="加载中"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ minHeight }}
        role="alert"
      >
        <TriangleAlert className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">数据加载失败，请稍后重试</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            重试
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2" style={{ minHeight }}>
        <Inbox className="size-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return null
}
