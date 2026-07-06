import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard, Users, Shield, Activity, FileText,
  ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightSmall,
  LogOut, User, Menu as MenuIcon, UserCog, Smartphone,
  Settings, Home, BarChart3, Database, Server, Mail,
  Bell, Star, Folder, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMenuTree } from '@/hooks/useMenuTree'
import type { MenuTreeVO } from '@/types/api'
import { Loader2 } from 'lucide-react'

/** Icon name -> component mapping */
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Shield, Activity, FileText, Menu: MenuIcon,
  UserCog, Smartphone, Settings, Home, BarChart3, Database, Server,
  Mail, Bell, Star, Folder,
}

function getIcon(name: string | null): React.ElementType {
  if (name && iconMap[name]) return iconMap[name]
  return Folder // fallback
}

interface FlatItem {
  menu: MenuTreeVO
  depth: number
  hasChildren: boolean
}

/** Flatten menu tree with depth info, respecting expanded state */
function flattenMenus(menus: MenuTreeVO[], expanded: Set<number>, depth = 0): FlatItem[] {
  const result: FlatItem[] = []
  for (const menu of menus) {
    const hasChildren = !!(menu.children && menu.children.length > 0)
    result.push({ menu, depth, hasChildren })
    if (hasChildren && expanded.has(menu.id)) {
      result.push(...flattenMenus(menu.children!, expanded, depth + 1))
    }
  }
  return result
}

/** Find the first menu (type=2) path in a tree (for collapsed directory navigation) */
function findFirstPath(menus: MenuTreeVO[]): string | null {
  for (const menu of menus) {
    if (menu.type === 2 && menu.path) return menu.path
    if (menu.children?.length) {
      const path = findFirstPath(menu.children)
      if (path) return path
    }
  }
  return null
}

/** Find active menu name by current path */
function findActiveName(menus: MenuTreeVO[], path: string): string | null {
  for (const menu of menus) {
    if (menu.path && path === menu.path) return menu.name
    if (menu.path && path.startsWith(menu.path) && menu.path !== '/') return menu.name
    if (menu.children?.length) {
      const name = findActiveName(menu.children, path)
      if (name) return name
    }
  }
  return null
}

/**
 * AdminLayout - Main admin layout with collapsible sidebar
 * Sidebar menu items are dynamically loaded from the backend based on user permissions.
 */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const navigate = useNavigate()
  const location = useLocation()
  const { data: menuTree, isLoading } = useMenuTree()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const flatItems = useMemo(() => {
    if (!menuTree) return []
    return flattenMenus(menuTree, expanded)
  }, [menuTree, expanded])

  const activeTitle = useMemo(() => {
    if (!menuTree) return '页面'
    return findActiveName(menuTree, location.pathname) || '页面'
  }, [menuTree, location.pathname])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMenuClick = (menu: MenuTreeVO) => {
    if (menu.type === 1 && menu.children?.length) {
      // Directory: toggle expand, or navigate to first child when collapsed
      if (collapsed) {
        const firstPath = findFirstPath(menu.children)
        if (firstPath) navigate({ to: firstPath })
      } else {
        toggleExpand(menu.id)
      }
    } else if (menu.path) {
      navigate({ to: menu.path })
    }
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
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TooltipProvider delayDuration={0}>
              {flatItems.map(({ menu, depth, hasChildren }) => {
                const Icon = getIcon(menu.icon)
                const active = menu.path ? isActive(menu.path) : false
                const isExpanded = expanded.has(menu.id)

                const button = (
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      collapsed && depth === 0 && 'justify-center px-2',
                      !collapsed && depth > 0 && 'ml-4',
                    )}
                    style={!collapsed ? { paddingLeft: `${depth * 16 + 8}px` } : undefined}
                    onClick={() => handleMenuClick(menu)}
                  >
                    <Icon className="size-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{menu.name}</span>
                        {hasChildren && (
                          isExpanded
                            ? <ChevronDown className="size-4 shrink-0" />
                            : <ChevronRightSmall className="size-4 shrink-0" />
                        )}
                      </>
                    )}
                  </Button>
                )

                // When collapsed, only show top-level items with tooltip
                if (collapsed && depth === 0) {
                  return (
                    <Tooltip key={menu.id}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right">{menu.name}</TooltipContent>
                    </Tooltip>
                  )
                }

                // When collapsed, skip non-top-level items
                if (collapsed && depth > 0) return null

                return <div key={menu.id}>{button}</div>
              })}
            </TooltipProvider>
          )}
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
          <h2 className="text-lg font-medium">{activeTitle}</h2>

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
