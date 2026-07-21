import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PageResult } from '@/types/api'

/** 收敛"page state + 分页查询"这套在各管理页面里重复的样板 */
export function usePagedQuery<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number) => Promise<PageResult<T>>,
) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => fetchPage(page),
  })

  return {
    page,
    setPage,
    records: data?.records ?? [],
    total: data?.total ?? 0,
    totalPages: data?.pages ?? 0,
    isLoading,
  }
}
