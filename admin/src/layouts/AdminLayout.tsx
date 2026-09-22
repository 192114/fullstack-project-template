import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Group as DropdownMenuGroup } from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { authApi } from '@/services/api/auth'
import { queryKeys } from '@/lib/queryKeys'
import { setTheme, useTheme } from '@/lib/theme'
import { QueryState } from '@/components/business/QueryState'
import { StatusBadge } from '@/components/business/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Menu as MenuIcon,
  UserCog,
  Smartphone,
  Settings,
  Home,
  BarChart3,
  Database,
  Server,
  Mail,
  Bell,
  Star,
  Folder,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMenuTree } from '@/hooks/useMenuTree'
import { tokenStore } from '@/lib/auth'
import type { MenuTreeVO } from '@/types/api'

/* ================================================================ *
 *  Helpers
 * ================================================================ */

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  FileText,
  Menu: MenuIcon,
  UserCog,
  Smartphone,
  Settings,
  Home,
  BarChart3,
  Database,
  Server,
  Mail,
  Bell,
  Star,
  Folder,
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
    return menu.children.some((child) => hasActiveChild(child, isActive))
  }
  return false
}

/** Find all parent menu IDs that should be auto-expanded (contain an active descendant) */
function findExpandableParentIds(
  menus: MenuTreeVO[],
  isActive: (path: string) => boolean,
): number[] {
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
  const hasChildren = !!menu.children?.length
  const active = menu.path ? isActive(menu.path) : false

  return (
    <div>
      <button
        onClick={() => onNavigate(menu)}
        className={cn(
          'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted',
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {menu.name}
      </button>
      {hasChildren &&
        menu.children!.map((child) => (
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
  contentRef,
}: {
  menu: MenuTreeVO
  isActive: (path: string) => boolean
  onNavigate: (menu: MenuTreeVO) => void
  pos: { top: number; left: number }
  onEnter: () => void
  onLeave: () => void
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  return createPortal(
    <div
      id={`flyout-${menu.id}`}
      ref={contentRef}
      className="animate-in fade-in-0 zoom-in-95 fixed z-50 max-h-[70dvh] min-w-[200px] overflow-auto rounded-xl border border-border bg-popover p-2 shadow-xl duration-200"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="mb-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {menu.name}
      </div>
      <div className="flex flex-col gap-0.5">
        {menu.children?.map((child) => (
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
  isActive,
  onMenuClick,
}: {
  menu: MenuTreeVO
  level: number
  expanded: Set<number>
  isActive: (path: string) => boolean
  onMenuClick: (menu: MenuTreeVO) => void
}) {
  const Icon = getIcon(menu.icon)
  const active = menu.path ? isActive(menu.path) : false
  const hasChildren = !!menu.children?.length
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
              : 'text-muted-foreground hover:bg-muted',
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onMenuClick(menu)}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-current={active ? 'page' : undefined}
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
          inert={!isExpanded}
        >
          <div className="overflow-hidden">
            {menu.children!.map((child) => (
              <MenuNode
                key={child.id}
                menu={child}
                level={level + 1}
                expanded={expanded}
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
  const flyoutRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const Icon = getIcon(menu.icon)
  const hasChildren = !!menu.children?.length
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
    hideTimer.current = setTimeout(() => {
      if (
        document.activeElement !== btnRef.current &&
        !flyoutRef.current?.contains(document.activeElement)
      )
        setShowFlyout(false)
    }, 150)
  }

  const flyoutEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  const flyoutLeave = handleLeave

  const handleNavigate = (m: MenuTreeVO) => {
    onMenuClick(m)
    setShowFlyout(false)
  }

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    },
    [],
  )

  // No children — simple icon button with tooltip
  if (!hasChildren) {
    const active = menu.path ? isActive(menu.path) : false
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={menu.name}
            aria-current={active ? 'page' : undefined}
            onClick={() => onMenuClick(menu)}
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors',
              active
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted',
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
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={(event) => {
        if (
          event.relatedTarget !== btnRef.current &&
          !flyoutRef.current?.contains(event.relatedTarget)
        )
          setShowFlyout(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          btnRef.current?.focus()
          setShowFlyout(false)
        } else if (
          event.target === btnRef.current &&
          (event.key === 'ArrowDown' || event.key === 'ArrowRight')
        ) {
          event.preventDefault()
          handleEnter()
          requestAnimationFrame(() => flyoutRef.current?.querySelector('button')?.focus())
        }
      }}
    >
      <button
        ref={btnRef}
        aria-label={menu.name}
        aria-expanded={showFlyout}
        aria-controls={`flyout-${menu.id}`}
        onClick={() => onMenuClick(menu)}
        className={cn(
          'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors',
          childActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted',
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
          contentRef={flyoutRef}
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
  const { data: menuTree, isLoading, isError, refetch } = useMenuTree()
  const theme = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const profile = useQuery({
    queryKey: queryKeys.currentAdmin,
    queryFn: () => authApi.getCurrentAdmin(),
    enabled: profileOpen,
  })
  const logout = useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      const token = tokenStore.get()
      try {
        await authApi.logout()
      } catch {
        toast.warning('服务端退出失败，已退出本地会话')
      } finally {
        // 旧会话的退出响应不能清除另一标签页刚建立的新会话。
        if (tokenStore.get() === token) {
          tokenStore.clear()
          queryClient.clear()
          await navigate({ to: '/login', replace: true })
        }
      }
    },
  })

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const breadcrumbs = useMemo(() => {
    if (!menuTree) return []
    return findMenuPath(menuTree, location.pathname) || []
  }, [menuTree, location.pathname])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
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
    setExpanded((prev) => {
      const next = new Set(prev)
      let changed = false
      ids.forEach((id) => {
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
          'flex flex-col border-r border-border bg-card transition-all duration-300',
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
              aria-label="展开侧栏"
              onClick={() => setCollapsed(false)}
              className="flex size-9 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform hover:scale-105"
            >
              <LayoutDashboard className="size-5 text-primary-foreground" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
                  <LayoutDashboard className="size-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">AdminPro</span>
              </div>
              <button
                aria-label="折叠侧栏"
                onClick={() => setCollapsed(true)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-visible p-3">
          {isLoading || isError ? (
            <QueryState
              isLoading={isLoading}
              isError={isError}
              isEmpty={false}
              minHeight="100px"
              onRetry={() => void refetch()}
            />
          ) : (
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-col gap-1">
                {collapsed
                  ? menuTree?.map((menu) => (
                      <CollapsedMenuItem
                        key={menu.id}
                        menu={menu}
                        isActive={isActive}
                        onMenuClick={handleMenuClick}
                      />
                    ))
                  : menuTree?.map((menu) => (
                      <MenuNode
                        key={menu.id}
                        menu={menu}
                        level={0}
                        expanded={expanded}
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
          <div className="shrink-0 border-t border-border p-3">
            <button
              aria-label="展开侧栏"
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
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
            <span className="text-muted-foreground">首页</span>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.id}>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <span
                  className={
                    i === breadcrumbs.length - 1
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  {crumb.name}
                </span>
              </Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === 'dark' ? '切换浅色主题' : '切换深色主题'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="我的账户">
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                    <User />
                    个人信息
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={logout.isPending}
                    onSelect={() => {
                      if (!queryClient.isMutating({ mutationKey: ['logout'] })) logout.mutate()
                    }}
                  >
                    <LogOut />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>个人信息</DialogTitle>
            <DialogDescription>当前登录的管理员账户</DialogDescription>
          </DialogHeader>
          <QueryState
            isLoading={profile.isLoading}
            isError={profile.isError}
            isEmpty={false}
            onRetry={() => void profile.refetch()}
          />
          {profile.isSuccess && (
            <dl className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-4 text-sm">
              <div>
                <dt className="text-muted-foreground">用户名</dt>
                <dd>{profile.data.username}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">昵称</dt>
                <dd>{profile.data.nickname || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">邮箱</dt>
                <dd className="break-all">{profile.data.email || '-'}</dd>
              </div>
              <div>
                <dt className="mb-1 text-muted-foreground">状态</dt>
                <dd>
                  <StatusBadge status={profile.data.status} />
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
