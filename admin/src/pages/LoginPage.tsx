import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { authApi } from '@/services/api/auth'

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码至少6位')
    .max(64, '密码最多64位'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.loginPassword(data)
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-4 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">欢迎登录</CardTitle>
        <CardDescription>Admin Dashboard 管理系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              autoComplete="tel"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="pr-10"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-9"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? '登录中...' : '登 录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
