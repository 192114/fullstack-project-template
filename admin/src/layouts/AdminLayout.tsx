import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MenuItem {
  label: string
  icon: React.ElementType
  path: string
}

const menuItems: MenuItem[] = [
  { label: '首页', icon: LayoutDashboard, path: '/' },
  { label: '用户管理', icon: Users, path: '/users' },
  { label: '角色管理', icon: Shield, path: '/roles' },
  { label: '健康检查', icon: Activity, path: '/health' },
  { label: '报表', icon: FileText, path: '/reports' },
]

/**
 * AdminLayout - Main admin layout with collapsible sidebar
 */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate({ to: '/login' })
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-primary">
              Admin
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          <TooltipProvider delayDuration={0}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              const button = (
                <Button
                  key={item.path}
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    collapsed && 'justify-center px-2'
                  )}
                  onClick={() => navigate({ to: item.path })}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.path}>{button}</div>
            })}
          </TooltipProvider>
        </nav>

        <Separator />

        {/* Bottom section */}
        <div className="p-2">
          <TooltipProvider delayDuration={0}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">退出登录</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="size-5" />
                <span className="ml-3">退出登录</span>
              </Button>
            )}
          </TooltipProvider>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h2 className="text-lg font-medium">
            {menuItems.find((item) => isActive(item.path))?.label || '页面'}
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <User className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: '/' })}>
                <User className="size-4" />
                个人信息
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
