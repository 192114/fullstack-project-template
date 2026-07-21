import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { MenuPage } from '@/pages/MenuPage'
import { RolePage } from '@/pages/RolePage'
import { AdminUserPage } from '@/pages/AdminUserPage'
import { AppUserPage } from '@/pages/AppUserPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { authApi } from '@/services/api/auth'
import { hasPermission, findFirstPermittedRoute } from '@/lib/permission'
import { queryClient } from '@/app/queryClient'

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
  component: AdminLayout,
  beforeLoad: async () => {
    // Check authentication - redirect to login if not authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
    // Prefetch permissions and store in context for child route guards.
    // Uses the same queryKey as usePermissions hook so the cache is shared.
    const permissions = await queryClient.ensureQueryData({
      queryKey: ['permissions'],
      queryFn: () => authApi.getPermissions(),
    })
    return { permissions }
  },
})

// Home/Dashboard route (index of admin)
const homeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: HomePage,
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
  component: MenuPage,
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
  component: RolePage,
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
  component: AdminUserPage,
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
  component: AppUserPage,
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
  component: ForbiddenPage,
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
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
