import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
  Outlet,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { Loader2, TriangleAlert } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { authApi } from '@/services/api/auth'
import { hasPermission, findFirstPermittedRoute } from '@/lib/permission'
import { queryKeys } from '@/lib/queryKeys'
import { tokenStore } from '@/lib/auth'
import { queryClient } from '@/app/queryClient'
import { Button } from '@/components/ui/button'

function RoutePending() {
  return (
    <div
      className="flex h-full min-h-[300px] items-center justify-center"
      role="status"
      aria-label="加载中"
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function RouteError() {
  const router = useRouter()
  return (
    <div
      className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3"
      role="alert"
    >
      <TriangleAlert className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">页面加载失败，请稍后重试</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.invalidate()}>
          重试
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    </div>
  )
}

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => <NotFoundPage />,
})

// Auth layout route (for login, register, etc.)
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: LoginPage,
})

// Admin layout route (authenticated routes)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: lazyRouteComponent(() => import('@/layouts/AdminLayout'), 'AdminLayout'),
  beforeLoad: async () => {
    // Check authentication - redirect to login if not authenticated
    const token = tokenStore.get()
    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
    const permissions = await queryClient.fetchQuery({
      queryKey: queryKeys.permissions,
      queryFn: ({ signal }) => authApi.getPermissions(signal),
    })
    if (token !== tokenStore.get()) throw redirect({ to: '/login' })
    return { permissions }
  },
})

// Home/Dashboard route (index of admin)
const homeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/pages/HomePage'), 'HomePage'),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.permissions, 'dashboard:view')) {
      // No dashboard permission — redirect to first permitted route instead of 403
      const firstRoute = findFirstPermittedRoute(context.permissions)
      throw redirect({ to: firstRoute || '/403' })
    }
  },
})

// Menu management route
const menuRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/menus',
  component: lazyRouteComponent(() => import('@/pages/MenuPage'), 'MenuPage'),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.permissions, 'menu:list')) {
      throw redirect({ to: '/403' })
    }
  },
})

// Role management route
const roleRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/roles',
  component: lazyRouteComponent(() => import('@/pages/RolePage'), 'RolePage'),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.permissions, 'role:list')) {
      throw redirect({ to: '/403' })
    }
  },
})

// Admin user management route
const adminUserRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin-users',
  component: lazyRouteComponent(() => import('@/pages/AdminUserPage'), 'AdminUserPage'),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.permissions, 'admin-user:list')) {
      throw redirect({ to: '/403' })
    }
  },
})

// App user management route
const appUserRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/app-users',
  component: lazyRouteComponent(() => import('@/pages/AppUserPage'), 'AppUserPage'),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.permissions, 'user:list')) {
      throw redirect({ to: '/403' })
    }
  },
})

// Forbidden route (403 page)
const forbiddenRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/403',
  component: lazyRouteComponent(() => import('@/pages/ForbiddenPage'), 'ForbiddenPage'),
})

// Route tree
const routeTree = rootRoute.addChildren([
  authRoute.addChildren([loginRoute]),
  adminRoute.addChildren([
    homeRoute,
    menuRoute,
    roleRoute,
    adminUserRoute,
    appUserRoute,
    forbiddenRoute,
  ]),
])

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteError,
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
