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

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
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
  beforeLoad: () => {
    // Check authentication - redirect to login if not authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
  },
})

// Home/Dashboard route (index of admin)
const homeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: HomePage,
})

// Menu management route
const menuRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/menus',
  component: MenuPage,
})

// Role management route
const roleRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/roles',
  component: RolePage,
})

// Admin user management route
const adminUserRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin-users',
  component: AdminUserPage,
})

// Route tree
const routeTree = rootRoute.addChildren([
  authRoute.addChildren([loginRoute]),
  adminRoute.addChildren([homeRoute, menuRoute, roleRoute, adminUserRoute]),
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
