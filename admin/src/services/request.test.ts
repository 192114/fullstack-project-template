import { AxiosError, CanceledError, isCancel } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { initSessionSync, tokenStore } from '@/lib/auth'
import { ApiError } from '@/services/errors'
import request, { requestApi } from '@/services/request'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'

// auth/request/router 存在循环引用；只替换导航，保留真实拦截器、存储与缓存。
vi.mock('@/app/router', () => ({ router: { navigate: vi.fn().mockResolvedValue(undefined) } }))

const adapter = vi.fn<AxiosAdapter>()

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse<unknown> {
  return { config, data, status, statusText: String(status), headers: {} }
}

function getResponse() {
  return request.get<ApiResponse<unknown>>('/test', { adapter })
}

beforeEach(() => {
  adapter.mockReset()
  vi.mocked(router.navigate).mockClear()
  tokenStore.clear()
  queryClient.clear()
})

afterEach(() => {
  tokenStore.clear()
  queryClient.clear()
  vi.restoreAllMocks()
})

describe('request', () => {
  it.each(['session-token', null])(
    '请求拦截器记录当前 token %s，而非调用方提供的快照',
    async (token) => {
      if (token) tokenStore.set(token)
      adapter.mockImplementation(async (config) =>
        response(config, { code: 200, msg: '成功', data: { id: 1 } }),
      )

      const result = await requestApi(
        request.get<ApiResponse<{ id: number }>>('/test', {
          adapter,
          tokenSnapshot: 'forged-token',
        }),
      )

      expect(result).toEqual({ id: 1 })
      const config = adapter.mock.calls[0][0]
      expect(config.tokenSnapshot).toBe(token)
      expect(config.headers.get('Authorization')).toBe(token ? `Bearer ${token}` : undefined)
    },
  )

  it.each([
    { code: 403, msg: '无权执行操作', expected: '无权执行操作' },
    { code: 20104, msg: '父级菜单不能为自身或其子菜单', expected: '父级菜单不能为自身或其子菜单' },
    { code: 500, msg: '', expected: '请求失败' },
  ])('HTTP 200 的业务码 $code 转为 ApiError', async ({ code, msg, expected }) => {
    adapter.mockImplementation(async (config) => response(config, { code, msg, data: null }))
    const result = requestApi(getResponse())

    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ code, status: 200, message: expected })
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it.each([
    {
      status: 403,
      body: { code: 20101, msg: '角色不允许删除', data: null },
      code: 20101,
      msg: '角色不允许删除',
    },
    {
      status: 503,
      body: { code: 500, msg: '服务暂不可用', data: null },
      code: 500,
      msg: '服务暂不可用',
    },
    { status: 502, body: undefined, code: 502, msg: '请求失败(502)' },
    { status: 500, body: { code: 500, msg: '', data: null }, code: 500, msg: '请求失败(500)' },
  ])('HTTP $status 保留业务码与后端消息或提供兜底', async ({ status, body, code, msg }) => {
    adapter.mockImplementation(async (config) => {
      // 自定义 adapter 不会自动执行 Axios settle，HTTP 错误必须由 adapter 拒绝。
      throw new AxiosError(
        'Axios generic message',
        'ERR_BAD_RESPONSE',
        config,
        undefined,
        response(config, body, status),
      )
    })
    const result = getResponse()

    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ code, status, message: msg })
    expect(router.navigate).not.toHaveBeenCalled()
  })

  describe.each([
    { label: 'HTTP 200 业务 401', status: 200, code: 401 },
    { label: 'HTTP 401', status: 401, code: 20100 },
    { label: 'HTTP 错误体业务 401', status: 403, code: 401 },
  ])('$label 会话竞态', ({ status, code }) => {
    it.each([
      { label: '旧 401 不清除新会话', nextToken: 'new-token', isCurrent: false },
      { label: '当前 401 清理并导航登录', nextToken: 'old-token', isCurrent: true },
    ])('$label', async ({ nextToken, isCurrent }) => {
      tokenStore.set('old-token')
      const started = deferred<InternalAxiosRequestConfig>()
      const pending = deferred<void>()
      adapter.mockImplementation(async (config) => {
        started.resolve(config)
        await pending.promise
        const result = response(config, { code, msg: '登录已失效', data: null }, status)
        if (status !== 200) {
          throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, result)
        }
        return result
      })
      const clear = vi.spyOn(queryClient, 'clear')
      const result = getResponse()
      const rejected = expect(result).rejects.toMatchObject({ code, status, message: '登录已失效' })
      const config = await started.promise
      expect(config.tokenSnapshot).toBe('old-token')
      expect(config.headers.get('Authorization')).toBe('Bearer old-token')

      tokenStore.set(nextToken)
      queryClient.setQueryData(['private-session'], nextToken)
      pending.resolve()
      await rejected

      if (isCurrent) {
        expect(tokenStore.get()).toBeNull()
        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        expect(clear).toHaveBeenCalledTimes(1)
        expect(router.navigate).toHaveBeenCalledExactlyOnceWith({ to: '/login' })
      } else {
        expect(tokenStore.get()).toBe('new-token')
        expect(queryClient.getQueryData(['private-session'])).toBe('new-token')
        expect(clear).not.toHaveBeenCalled()
        expect(router.navigate).not.toHaveBeenCalled()
      }
    })
  })

  it('取消错误原样返回，不清理会话也不导航', async () => {
    const error = new CanceledError('查询已取消')
    tokenStore.set('current-token')
    queryClient.setQueryData(['private-session'], 'cached')
    adapter.mockRejectedValueOnce(error)
    const result = getResponse()

    await expect(result).rejects.toBe(error)
    expect(isCancel(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
    expect(tokenStore.get()).toBe('current-token')
    expect(queryClient.getQueryData(['private-session'])).toBe('cached')
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('AbortSignal 透传至 adapter，取消后仍可被 Axios 识别', async () => {
    const controller = new AbortController()
    const started = deferred<InternalAxiosRequestConfig>()
    adapter.mockImplementation((config) => {
      started.resolve(config)
      return new Promise((_resolve, reject) => {
        config.signal?.addEventListener?.(
          'abort',
          () => reject(new CanceledError('取消', config)),
          { once: true },
        )
      })
    })
    const result = request.get('/test', { adapter, signal: controller.signal })
    const rejected = expect(result).rejects.toBeInstanceOf(CanceledError)
    const config = await started.promise
    expect(config.signal).toBe(controller.signal)

    controller.abort()
    await rejected
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('无 HTTP 响应的网络异常归一为 code/status 0', async () => {
    adapter.mockImplementation(async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    })
    const result = getResponse()

    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ code: 0, status: 0, message: '网络连接失败' })
    expect(router.navigate).not.toHaveBeenCalled()
  })
})

describe('跨标签会话同步', () => {
  let dispose: () => void

  beforeEach(() => {
    dispose = initSessionSync()
    queryClient.setQueryData(['private-session'], 'cached')
  })

  afterEach(() => dispose())

  it.each([
    { key: 'token', oldValue: 'old-token', newValue: 'new-token' },
    { key: 'token', oldValue: 'old-token', newValue: null },
    { key: null, oldValue: null, newValue: null },
  ])('localStorage 变化 $key/$newValue 清缓存并替换导航', (event) => {
    window.dispatchEvent(new StorageEvent('storage', { ...event, storageArea: localStorage }))

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(router.navigate).toHaveBeenCalledExactlyOnceWith({ to: '/login', replace: true })
  })

  it('忽略其他 key、未变化的 token 及非 localStorage 事件，注销监听后不再响应', () => {
    const events: StorageEventInit[] = [
      { key: 'admin-theme', oldValue: 'light', newValue: 'dark', storageArea: localStorage },
      { key: 'token', oldValue: 'same', newValue: 'same', storageArea: localStorage },
      { key: 'token', oldValue: 'old', newValue: null, storageArea: sessionStorage },
      { key: 'token', oldValue: 'old', newValue: null, storageArea: null },
    ]
    for (const event of events) {
      window.dispatchEvent(new StorageEvent('storage', event))
    }
    dispose()
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'token',
        oldValue: 'old',
        newValue: null,
        storageArea: localStorage,
      }),
    )

    expect(queryClient.getQueryData(['private-session'])).toBe('cached')
    expect(router.navigate).not.toHaveBeenCalled()
  })
})

describe('QueryClient 默认重试策略', () => {
  it.each([
    { label: '网络错误', error: new ApiError('网络错误', 0, 0), attempts: 2 },
    { label: 'HTTP 5xx', error: new ApiError('服务不可用', 503, 503), attempts: 2 },
    { label: 'HTTP 400', error: new ApiError('参数错误', 400, 400), attempts: 1 },
    { label: 'HTTP 401', error: new ApiError('未登录', 401, 401), attempts: 1 },
    { label: 'HTTP 403', error: new ApiError('无权限', 403, 403), attempts: 1 },
    { label: 'HTTP 200 业务错误', error: new ApiError('业务失败', 20104, 200), attempts: 1 },
    { label: '取消', error: new CanceledError('取消'), attempts: 1 },
  ])('$label 共尝试 $attempts 次', async ({ error, attempts }) => {
    const queryFn = vi.fn().mockRejectedValue(error)
    await expect(
      queryClient.fetchQuery({
        queryKey: ['retry-test'],
        queryFn,
        retryDelay: 0,
        gcTime: Infinity,
      }),
    ).rejects.toBe(error)
    expect(queryFn).toHaveBeenCalledTimes(attempts)
  })
})
