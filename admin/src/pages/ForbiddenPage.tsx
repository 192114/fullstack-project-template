import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/usePermissions'
import { findFirstPermittedRoute } from '@/lib/permission'

export function ForbiddenPage() {
  const navigate = useNavigate()
  const { data: permissions = [] } = usePermissions()

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      const firstRoute = findFirstPermittedRoute(permissions)
      navigate({ to: firstRoute || '/login' })
    }
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-red-50">
            <ShieldX className="size-10 text-red-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-300">403</h1>
        <p className="mt-2 text-lg font-medium text-gray-600">无权限访问</p>
        <p className="mt-1 text-sm text-gray-400">您没有访问该页面的权限，请联系管理员</p>
        <Button className="mt-6" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          返回上一页
        </Button>
      </div>
    </div>
  )
}
