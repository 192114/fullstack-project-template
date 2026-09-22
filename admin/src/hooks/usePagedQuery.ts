import { useEffect, useState } from 'react'
import { hashKey, keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PageResult } from '@/types/api'

export function usePagedQuery<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, signal: AbortSignal) => Promise<PageResult<T>>,
) {
  const filterKey = hashKey(queryKey)
  const [pagination, setPagination] = useState({ filterKey, page: 1 })
  const page = pagination.filterKey === filterKey ? pagination.page : 1
  if (pagination.filterKey !== filterKey) setPagination({ filterKey, page: 1 })

  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => fetchPage(page, signal),
    placeholderData: keepPreviousData,
  })
  const totalPages = query.data?.pages ?? 0

  useEffect(() => {
    // 占位数据属于上一次查询，不能用于修正新查询的页码。
    if (query.isSuccess && !query.isPlaceholderData && page > Math.max(1, totalPages)) {
      setPagination({ filterKey, page: Math.max(1, totalPages) })
    }
  }, [filterKey, page, totalPages, query.isSuccess, query.isPlaceholderData])

  return {
    page,
    setPage: (nextPage: number) => setPagination({ filterKey, page: Math.max(1, nextPage) }),
    records: query.data?.records ?? [],
    total: query.data?.total ?? 0,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
