import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/services/api/auth'
import { tokenStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名').max(32, '用户名最多32个字符'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少6位').max(64, '密码最多64位'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })
  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const response = await authApi.login(data)
      tokenStore.set(response.token)
      queryClient.clear()
      await navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-2xl border-0 shadow-sm">
      <CardHeader className="gap-2 text-center">
        <CardTitle>欢迎登录</CardTitle>
        <CardDescription>Admin Dashboard 管理系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
          aria-busy={isSubmitting}
        >
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <FieldGroup>
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">用户名</FieldLabel>
              <Input
                id="username"
                autoComplete="username"
                placeholder="请输入用户名"
                className="h-11 rounded-xl border-0 bg-muted! shadow-none"
                disabled={isSubmitting}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
                {...register('username')}
              />
              <FieldError id="username-error" errors={[errors.username]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  className="h-11 rounded-xl border-0 bg-muted! pr-12 shadow-none"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  disabled={isSubmitting}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <FieldError id="password-error" errors={[errors.password]} />
            </Field>
          </FieldGroup>
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={isSubmitting}>
            {isSubmitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {isSubmitting ? '登录中...' : '登 录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
