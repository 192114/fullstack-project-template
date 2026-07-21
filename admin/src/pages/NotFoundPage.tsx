import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      const token = localStorage.getItem('token')
      navigate({ to: token ? '/' : '/login' })
    }
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-gray-100">
            <FileQuestion className="size-10 text-gray-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-2 text-lg font-medium text-gray-600">页面不存在</p>
        <p className="mt-1 text-sm text-gray-400">您访问的页面可能已被移除或地址有误</p>
        <Button className="mt-6" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          返回上一页
        </Button>
      </div>
    </div>
  )
}
