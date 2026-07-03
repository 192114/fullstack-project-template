import { Outlet } from '@tanstack/react-router'

/**
 * AuthLayout - Layout for authentication pages (login, register, etc.)
 * Centered card layout with background
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
