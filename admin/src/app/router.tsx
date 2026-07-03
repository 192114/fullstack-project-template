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
    const token = localStorage.getItem('accessToken')
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

// Route tree
const routeTree = rootRoute.addChildren([
  authRoute.addChildren([loginRoute]),
  adminRoute.addChildren([homeRoute]),
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
