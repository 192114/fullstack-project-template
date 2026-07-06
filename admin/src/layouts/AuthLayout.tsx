import { Outlet } from '@tanstack/react-router'
import { Shield, Zap, BarChart3, Microscope } from 'lucide-react'

/**
 * AuthLayout - Layout for authentication pages (login, register, etc.)
 * Split-screen layout: left hero panel with DNA background, right form panel
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - DNA background hero */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 xl:w-[55%]">
        <img
          src="/login-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlay for better text readability and brand cohesion */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-950/30 to-slate-900/50" />

        {/* Content overlay */}
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/25">
              <Microscope className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Admin Dashboard
            </span>
          </div>

          {/* Middle - Welcome heading */}
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              欢迎回来 👋
            </h1>
            <p className="mt-4 text-base leading-relaxed text-blue-50/80 xl:text-lg">
              登录您的账户，继续探索更多可能性
            </p>
          </div>

          {/* Bottom - Features & Copyright */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
                  <Shield className="size-4 text-blue-100" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">安全可靠</p>
                  <p className="text-xs text-blue-100/60">多重安全保障</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
                  <Zap className="size-4 text-blue-100" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">高效便捷</p>
                  <p className="text-xs text-blue-100/60">提升工作效率</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
                  <BarChart3 className="size-4 text-blue-100" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">数据驱动</p>
                  <p className="text-xs text-blue-100/60">洞察业务增长</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-blue-100/50">
              © 2024 Admin Dashboard. 保留所有权利。
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Form area */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
