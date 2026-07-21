import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, Users, Shield, Activity, FileText,
  ChevronLeft, ChevronRight, ChevronDown,
  LogOut, User, Menu as MenuIcon, UserCog, Smartphone,
  Settings, Home, BarChart3, Database, Server, Mail,
  Bell, Star, Folder, Sun, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

/* ================================================================ *
 *  Helpers
 * ================================================================ */

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Shield, Activity, FileText, Menu: MenuIcon,
  UserCog, Smartphone, Settings, Home, BarChart3, Database, Server,
  Mail, Bell, Star, Folder,
}

function getIcon(name: string | null): React.ElementType {
  if (name && iconMap[name]) return iconMap[name]
  return Folder
}

/** Find the first leaf-menu (type=2) path in a tree */
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

/** Find the full menu path (ancestors → self) for a given route */
function findMenuPath(menus: MenuTreeVO[], pathname: string): MenuTreeVO[] | null {
  for (const menu of menus) {
    if (menu.path && pathname === menu.path) {
      return [menu]
    }
    if (menu.path && pathname.startsWith(menu.path) && menu.path !== '/') {
      if (menu.children?.length) {
        const childResult = findMenuPath(menu.children, pathname)
        if (childResult) return [menu, ...childResult]
      }
      return [menu]
    }
    if (menu.children?.length) {
      const childResult = findMenuPath(menu.children, pathname)
      if (childResult) return [menu, ...childResult]
    }
  }
  return null
}

/** Check if any descendant of a menu is active */
function hasActiveChild(menu: MenuTreeVO, isActive: (path: string) => boolean): boolean {
  if (menu.path && isActive(menu.path)) return true
  if (menu.children?.length) {
    return menu.children.some(child => hasActiveChild(child, isActive))
  }
  return false
}

/** Find all parent menu IDs that should be auto-expanded (contain an active descendant) */
function findExpandableParentIds(menus: MenuTreeVO[], isActive: (path: string) => boolean): number[] {
  const result: number[] = []
  for (const menu of menus) {
    if (menu.children?.length) {
      if (hasActiveChild(menu, isActive)) {
        result.push(menu.id)
      }
      result.push(...findExpandableParentIds(menu.children, isActive))
    }
  }
  return result
}

/* ================================================================ *
 *  Collapsed Flyout (hover popup — like Element Plus)
 * ================================================================ */

/** Single item inside the flyout popup */
function FlyoutItem({
  menu,
  level,
  isActive,
  onNavigate,
}: {
  menu: MenuTreeVO
  level: number
  isActive: (path: string) => boolean
  onNavigate: (menu: MenuTreeVO) => void
}) {
  const hasChildren = !!(menu.children?.length)
  const active = menu.path ? isActive(menu.path) : false

  return (
    <div>
      <button
        onClick={() => onNavigate(menu)}
        className={cn(
          'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-gray-600 hover:bg-gray-100',
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {menu.name}
      </button>
      {hasChildren && menu.children!.map(child => (
        <FlyoutItem
          key={child.id}
          menu={child}
          level={level + 1}
          isActive={isActive}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

/** The flyout popup rendered in a portal (to escape sidebar overflow) */
function CollapsedFlyout({
  menu,
  isActive,
  onNavigate,
  pos,
  onEnter,
  onLeave,
}: {
  menu: MenuTreeVO
  isActive: (path: string) => boolean
  onNavigate: (menu: MenuTreeVO) => void
  pos: { top: number; left: number }
  onEnter: () => void
  onLeave: () => void
}) {
  return createPortal(
    <div
      className="animate-in fade-in-0 zoom-in-95 fixed z-50 min-w-[200px] rounded-xl border border-gray-200 bg-white p-2 shadow-xl duration-200"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="mb-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {menu.name}
      </div>
      <div className="space-y-0.5">
        {menu.children?.map(child => (
          <FlyoutItem
            key={child.id}
            menu={child}
            level={0}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>,
    document.body,
  )
}

/* ================================================================ *
 *  Expanded Menu Node (with height transition)
 * ================================================================ */

function MenuNode({
  menu,
  level,
  expanded,
  toggleExpand,
  isActive,
  onMenuClick,
}: {
  menu: MenuTreeVO
  level: number
  expanded: Set<number>
  toggleExpand: (id: number) => void
  isActive: (path: string) => boolean
  onMenuClick: (menu: MenuTreeVO) => void
}) {
  const Icon = getIcon(menu.icon)
  const active = menu.path ? isActive(menu.path) : false
  const hasChildren = !!(menu.children?.length)
  const isExpanded = expanded.has(menu.id)
  const childActive = hasChildren && !active && hasActiveChild(menu, isActive)

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : childActive
              ? 'font-medium text-primary'
              : 'text-gray-600 hover:bg-gray-100',
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onMenuClick(menu)}
      >
        <Icon className="size-5 shrink-0" />
        <span className="flex-1 text-left">{menu.name}</span>
        {hasChildren && (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 transition-transform duration-300 ease-in-out',
              !isExpanded && '-rotate-90',
            )}
          />
        )}
      </button>

      {/* Animated collapsible children container (grid 0fr → 1fr trick) */}
      {hasChildren && (
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            {menu.children!.map(child => (
              <MenuNode
                key={child.id}
                menu={child}
                level={level + 1}
                expanded={expanded}
                toggleExpand={toggleExpand}
                isActive={isActive}
                onMenuClick={onMenuClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================ *
 *  Collapsed Menu Item (icon-only with hover flyout)
 * ================================================================ */

function CollapsedMenuItem({
  menu,
  isActive,
  onMenuClick,
}: {
  menu: MenuTreeVO
  isActive: (path: string) => boolean
  onMenuClick: (menu: MenuTreeVO) => void
}) {
  const [showFlyout, setShowFlyout] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const Icon = getIcon(menu.icon)
  const hasChildren = !!(menu.children?.length)
  const childActive = hasActiveChild(menu, isActive)

  const handleEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (hasChildren && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.right + 6 })
    }
    if (hasChildren) setShowFlyout(true)
  }

  const handleLeave = () => {
    hideTimer.current = setTimeout(() => setShowFlyout(false), 150)
  }

  const flyoutEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  const flyoutLeave = () => setShowFlyout(false)

  const handleNavigate = (m: MenuTreeVO) => {
    onMenuClick(m)
    setShowFlyout(false)
  }

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  // No children — simple icon button with tooltip
  if (!hasChildren) {
    const active = menu.path ? isActive(menu.path) : false
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onMenuClick(menu)}
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors',
              active
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            <Icon className="size-5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{menu.name}</TooltipContent>
      </Tooltip>
    )
  }

  // Has children — icon button with hover flyout
  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        ref={btnRef}
        onClick={() => onMenuClick(menu)}
        className={cn(
          'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors',
          childActive
            ? 'text-primary'
            : 'text-gray-600 hover:bg-gray-100',
        )}
      >
        <Icon className="size-5 shrink-0" />
      </button>
      {showFlyout && (
        <CollapsedFlyout
          menu={menu}
          isActive={isActive}
          onNavigate={handleNavigate}
          pos={pos}
          onEnter={flyoutEnter}
          onLeave={flyoutLeave}
        />
      )}
    </div>
  )
}

/* ================================================================ *
 *  AdminLayout
 * ================================================================ */

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { data: menuTree, isLoading } = useMenuTree()

  const handleLogout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    navigate({ to: '/login' })
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const breadcrumbs = useMemo(() => {
    if (!menuTree) return []
    return findMenuPath(menuTree, location.pathname) || []
  }, [menuTree, location.pathname])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Auto-expand parent menus that contain the active route
  useEffect(() => {
    if (!menuTree) return
    const pathname = location.pathname
    const checkActive = (path: string) => {
      if (path === '/') return pathname === '/'
      return pathname.startsWith(path)
    }
    const ids = findExpandableParentIds(menuTree, checkActive)
    if (ids.length === 0) return
    setExpanded(prev => {
      const next = new Set(prev)
      let changed = false
      ids.forEach(id => {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [menuTree, location.pathname])

  const handleMenuClick = (menu: MenuTreeVO) => {
    if (menu.type === 1 && menu.children?.length) {
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
      {/* ======================== Sidebar (Full Height, Collapsible) ======================== */}
      <aside
        className={cn(
          'flex flex-col border-r border-gray-200 bg-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-52',
        )}
      >
        {/* Logo + Collapse Toggle */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center',
            collapsed ? 'justify-center' : 'justify-between px-4',
          )}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm transition-transform hover:scale-105"
            >
              <LayoutDashboard className="size-5 text-white" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
                  <LayoutDashboard className="size-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">AdminPro</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-visible p-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <TooltipProvider delayDuration={0}>
              <div className="space-y-1">
                {collapsed
                  ? menuTree?.map(menu => (
                      <CollapsedMenuItem
                        key={menu.id}
                        menu={menu}
                        isActive={isActive}
                        onMenuClick={handleMenuClick}
                      />
                    ))
                  : menuTree?.map(menu => (
                      <MenuNode
                        key={menu.id}
                        menu={menu}
                        level={0}
                        expanded={expanded}
                        toggleExpand={toggleExpand}
                        isActive={isActive}
                        onMenuClick={handleMenuClick}
                      />
                    ))}
              </div>
            </TooltipProvider>
          )}
        </nav>

        {/* Collapse Toggle (bottom — only when collapsed) */}
        {collapsed && (
          <div className="shrink-0 border-t border-gray-200 p-3">
            <button
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </aside>

      {/* ======================== Main Content Area ======================== */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/40">
        {/* Header — Transparent */}
        <header className="flex h-16 shrink-0 items-center justify-between px-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">首页</span>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.id}>
                <ChevronRight className="size-3.5 text-gray-300" />
                <span className={i === breadcrumbs.length - 1 ? 'font-medium text-gray-800' : 'text-gray-500'}>
                  {crumb.name}
                </span>
              </Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <Sun className="size-5" />
            </button>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative">
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                    <User className="size-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500" />
                </button>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
