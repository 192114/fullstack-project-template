import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '@/lib/auth'
import { LoginPage } from '@/pages/LoginPage'
import { authApi } from '@/services/api/auth'
import { ApiError } from '@/services/errors'
import type { AdminLoginResponse } from '@/types/api'

vi.mock('@/app/router', () => ({ router: { navigate: vi.fn() } }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: vi.fn() }))
vi.mock('@/services/api/auth', () => ({ authApi: { login: vi.fn() } }))

const LOGIN_RESPONSE: AdminLoginResponse = {
  token: 'new-session-token',
  user: {
    id: 1,
    username: 'admin',
    nickname: '管理员',
    email: null,
    status: 1,
    createTime: '2026-09-22T00:00:00',
    updateTime: '2026-09-22T00:00:00',
  },
}

const navigate = vi.fn().mockResolvedValue(undefined)
let queryClient: QueryClient

function renderLogin() {
  render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  )
  return {
    username: screen.getByRole('textbox', { name: '用户名' }),
    password: screen.getByLabelText('密码', { exact: true }),
    submit: screen.getByRole('button', { name: '登 录' }),
  }
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  tokenStore.clear()
  vi.mocked(authApi.login).mockReset()
  navigate.mockReset().mockResolvedValue(undefined)
  vi.mocked(useNavigate).mockReturnValue(navigate)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  tokenStore.clear()
  vi.restoreAllMocks()
})

describe('LoginPage', () => {
  it('空表单显示必填错误，并通过 label、aria-invalid 和 aria-describedby 关联控件', async () => {
    const { username, password, submit } = renderLogin()
    expect(username).toHaveAttribute('aria-invalid', 'false')
    expect(password).toHaveAttribute('aria-invalid', 'false')
    expect(username).not.toHaveAttribute('aria-describedby')
    expect(password).not.toHaveAttribute('aria-describedby')
    fireEvent.click(submit)

    expect(await screen.findByText('请输入用户名')).toHaveAttribute('id', 'username-error')
    expect(await screen.findByText('请输入密码')).toHaveAttribute('id', 'password-error')
    expect(username).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(username).toHaveAttribute('aria-describedby', 'username-error')
    expect(password).toHaveAttribute('aria-describedby', 'password-error')
    expect(username).toHaveAccessibleDescription('请输入用户名')
    expect(password).toHaveAccessibleDescription('请输入密码')
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(authApi.login).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each([
    { username: '   ', password: '123456', field: '用户名', message: '请输入用户名' },
    { username: 'admin', password: '12345', field: '密码', message: '密码至少6位' },
    {
      username: 'a'.repeat(33),
      password: '123456',
      field: '用户名',
      message: '用户名最多32个字符',
    },
    { username: 'admin', password: 'p'.repeat(65), field: '密码', message: '密码最多64位' },
  ])('$message 时阻止提交并关联字段错误', async (values) => {
    const { username, password, submit } = renderLogin()
    fireEvent.change(username, { target: { value: values.username } })
    fireEvent.change(password, { target: { value: values.password } })
    fireEvent.click(submit)

    expect(await screen.findByText(values.message)).toHaveAttribute('role', 'alert')
    const invalidField = screen.getByLabelText(values.field, { exact: true })
    expect(invalidField).toHaveAttribute('aria-invalid', 'true')
    expect(invalidField).toHaveAccessibleDescription(values.message)
    expect(authApi.login).not.toHaveBeenCalled()
    expect(tokenStore.get()).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each([
    { username: '  a  ', expectedUsername: 'a', password: '123456' },
    {
      username: `  ${'a'.repeat(32)}  `,
      expectedUsername: 'a'.repeat(32),
      password: 'p'.repeat(64),
    },
  ])('合法长度边界可提交，用户名 trim 后保存 token、清缓存再导航', async (values) => {
    vi.mocked(authApi.login).mockResolvedValueOnce(LOGIN_RESPONSE)
    queryClient.setQueryData(['private-session'], 'previous-user')
    const clear = vi.spyOn(queryClient, 'clear')
    const setToken = vi.spyOn(tokenStore, 'set')
    navigate.mockImplementation(async () => {
      expect(tokenStore.get()).toBe(LOGIN_RESPONSE.token)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    })
    const { username, password, submit } = renderLogin()
    fireEvent.change(username, { target: { value: values.username } })
    fireEvent.change(password, { target: { value: values.password } })
    fireEvent.click(submit)

    await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: '/' }))
    expect(authApi.login).toHaveBeenCalledExactlyOnceWith({
      username: values.expectedUsername,
      password: values.password,
    })
    expect(setToken).toHaveBeenCalledExactlyOnceWith(LOGIN_RESPONSE.token)
    expect(clear).toHaveBeenCalledTimes(1)
    expect(setToken.mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0])
    expect(clear.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0])
    expect(tokenStore.get()).toBe(LOGIN_RESPONSE.token)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('请求未完成时禁用提交和字段，避免重复请求，完成后恢复', async () => {
    let resolveLogin!: (response: AdminLoginResponse) => void
    vi.mocked(authApi.login).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve
      }),
    )
    const { username, password, submit } = renderLogin()
    fireEvent.change(username, { target: { value: 'admin' } })
    fireEvent.change(password, { target: { value: '123456' } })
    fireEvent.click(submit)

    const pendingButton = await screen.findByRole('button', { name: '登录中...' })
    expect(pendingButton).toBeDisabled()
    expect(username).toBeDisabled()
    expect(password).toBeDisabled()
    expect(pendingButton.closest('form')).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(pendingButton)
    expect(authApi.login).toHaveBeenCalledTimes(1)
    expect(tokenStore.get()).toBeNull()
    expect(navigate).not.toHaveBeenCalled()

    await act(async () => resolveLogin(LOGIN_RESPONSE))
    await waitFor(() => expect(screen.getByRole('button', { name: '登 录' })).toBeEnabled())
    expect(username).toBeEnabled()
    expect(password).toBeEnabled()
    expect(submit.closest('form')).toHaveAttribute('aria-busy', 'false')
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it.each([
    { error: new ApiError('用户名或密码错误', 20100, 400), message: '用户名或密码错误' },
    { error: 'unknown failure', message: '登录失败，请稍后重试' },
  ])('登录失败显示 $message，不保存 token 或清缓存，允许重试', async ({ error, message }) => {
    vi.mocked(authApi.login).mockRejectedValueOnce(error).mockResolvedValueOnce(LOGIN_RESPONSE)
    queryClient.setQueryData(['existing-cache'], 'preserved')
    const clear = vi.spyOn(queryClient, 'clear')
    const { username, password, submit } = renderLogin()
    fireEvent.change(username, { target: { value: 'admin' } })
    fireEvent.change(password, { target: { value: '123456' } })
    fireEvent.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(tokenStore.get()).toBeNull()
    expect(queryClient.getQueryData(['existing-cache'])).toBe('preserved')
    expect(clear).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(submit).toBeEnabled()

    fireEvent.click(submit)
    await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: '/' }))
    expect(authApi.login).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
