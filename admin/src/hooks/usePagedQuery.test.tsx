import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { ApiError } from '@/services/errors'
import type { ReactNode } from 'react'
import type { PageResult } from '@/types/api'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function pageResult(current: number, pages = 3): PageResult<string> {
  return {
    current,
    pages,
    size: 10,
    total: pages * 10,
    records: current <= pages ? [`record-${current}`] : [],
  }
}

let queryClient: QueryClient

function QueryWrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
})

afterEach(() => {
  cleanup()
  queryClient.clear()
})

describe('usePagedQuery', () => {
  it('首屏加载时提供默认值，完成后透出分页结果', async () => {
    const pending = deferred<PageResult<string>>()
    const fetchPage = vi.fn(() => pending.promise)
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })

    expect(result.current).toMatchObject({
      page: 1,
      records: [],
      total: 0,
      totalPages: 0,
      isLoading: true,
      isFetching: true,
      isPlaceholderData: false,
      isError: false,
      error: null,
    })

    await act(async () => pending.resolve(pageResult(1)))
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(result.current).toMatchObject({
      records: ['record-1'],
      total: 30,
      totalPages: 3,
      isLoading: false,
    })
  })

  it.each([2, 0])('总页数从 3 收缩至 %i 时回退到有效页并查询', async (remainingPages) => {
    let pages = 3
    const fetchPage = vi.fn(async (page: number) => pageResult(page, pages))
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    act(() => result.current.setPage(3))
    await waitFor(() => expect(result.current.records).toEqual(['record-3']))

    pages = remainingPages
    await act(async () => {
      // 删除会失效整个列表；回退到缓存过的第 1 页时也必须获取新的总数。
      await queryClient.invalidateQueries({ queryKey: ['items'] })
    })

    const expectedPage = Math.max(1, remainingPages)
    await waitFor(() => {
      expect(result.current.page).toBe(expectedPage)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.totalPages).toBe(remainingPages)
    })
    expect(result.current.records).toEqual(remainingPages === 0 ? [] : ['record-2'])
    expect(result.current.total).toBe(remainingPages * 10)
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 3, 3, expectedPage])
  })

  it('setPage 不允许零或负页码', async () => {
    const fetchPage = vi.fn(async (page: number) => pageResult(page))
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.isFetching).toBe(false))

    act(() => result.current.setPage(0))
    expect(result.current.page).toBe(1)
    act(() => result.current.setPage(-3))
    expect(result.current.page).toBe(1)
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('透出原始错误，refetch 成功后恢复数据与状态', async () => {
    const error = new ApiError('分页请求失败', 503, 503)
    const fetchPage = vi.fn<() => Promise<PageResult<string>>>().mockRejectedValueOnce(error)
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
    expect(result.current.records).toEqual([])
    expect(result.current.isFetching).toBe(false)
    expect(fetchPage).toHaveBeenCalledTimes(1)

    fetchPage.mockResolvedValueOnce(pageResult(1))
    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.records).toEqual(['record-1'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('新页请求失败时不根据缺失数据把当前页误修正为 1', async () => {
    const error = new ApiError('加载失败', 500, 500)
    const fetchPage = vi
      .fn<() => Promise<PageResult<string>>>()
      .mockResolvedValueOnce(pageResult(1))
      .mockRejectedValueOnce(error)
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    act(() => result.current.setPage(3))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.page).toBe(3)
    expect(result.current.error).toBe(error)
    expect(result.current.totalPages).toBe(0)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('新页等待期间保留旧数据，不能用旧总页数 clamp 新页', async () => {
    const pending = deferred<PageResult<string>>()
    const fetchPage = vi
      .fn<() => Promise<PageResult<string>>>()
      .mockResolvedValueOnce(pageResult(1, 1))
      .mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => usePagedQuery(['items'], fetchPage), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    act(() => result.current.setPage(3))

    expect(result.current).toMatchObject({
      page: 3,
      records: ['record-1'],
      total: 10,
      totalPages: 1,
      isPlaceholderData: true,
      isFetching: true,
      isLoading: false,
    })
    expect(fetchPage).toHaveBeenCalledTimes(2)

    await act(async () => pending.resolve(pageResult(3)))
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false))
    expect(result.current.page).toBe(3)
    expect(result.current.records).toEqual(['record-3'])
    expect(result.current.totalPages).toBe(3)
    expect(result.current.isFetching).toBe(false)
  })

  it('相同筛选内容和不同属性顺序不重置页码，筛选变化及切回均回到第 1 页', async () => {
    const fetchPage = vi.fn(async (page: number) => pageResult(page))
    const { result, rerender } = renderHook(
      ({ filters }) => usePagedQuery(['items', filters], fetchPage),
      { wrapper: QueryWrapper, initialProps: { filters: { name: 'admin', status: 1 } } },
    )
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    act(() => result.current.setPage(3))
    await waitFor(() => expect(result.current.records).toEqual(['record-3']))

    rerender({ filters: { status: 1, name: 'admin' } })
    expect(result.current.page).toBe(3)
    expect(fetchPage).toHaveBeenCalledTimes(2)

    rerender({ filters: { name: 'admin', status: 0 } })
    expect(result.current.page).toBe(1)
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 3, 1])
    expect(queryClient.getQueryState(['items', { name: 'admin', status: 0 }, 3])).toBeUndefined()

    act(() => result.current.setPage(2))
    await waitFor(() => expect(result.current.records).toEqual(['record-2']))
    rerender({ filters: { name: 'admin', status: 1 } })
    expect(result.current.page).toBe(1)
    expect(result.current.records).toEqual(['record-1'])
  })

  it('向 fetchPage 传递 AbortSignal，筛选切换及卸载取消未完成请求', () => {
    const pending = deferred<PageResult<string>>()
    const fetchPage = vi.fn((_page: number, _signal: AbortSignal) => pending.promise)
    const { rerender, unmount } = renderHook(
      ({ filter }) => usePagedQuery(['items', filter], fetchPage),
      { wrapper: QueryWrapper, initialProps: { filter: 'old' } },
    )
    const firstSignal = fetchPage.mock.calls[0][1]
    expect(firstSignal).toBeInstanceOf(AbortSignal)
    expect(firstSignal.aborted).toBe(false)

    rerender({ filter: 'new' })
    const secondSignal = fetchPage.mock.calls[1][1]
    expect(firstSignal.aborted).toBe(true)
    expect(secondSignal).not.toBe(firstSignal)
    expect(secondSignal.aborted).toBe(false)
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 1])

    unmount()
    expect(secondSignal.aborted).toBe(true)
  })
})
