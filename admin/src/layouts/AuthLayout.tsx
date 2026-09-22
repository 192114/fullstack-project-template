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
          src="/login-bg.webp"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlay for better text readability and brand cohesion */}
        <div className="absolute inset-0 bg-hero-background/60" />

        {/* Content overlay */}
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-hero-foreground/15 backdrop-blur-md ring-1 ring-hero-foreground/25">
              <Microscope className="size-6 text-hero-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-hero-foreground">
              Admin Dashboard
            </span>
          </div>

          {/* Middle - Welcome heading */}
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold leading-tight text-hero-foreground xl:text-5xl">
              欢迎回来 👋
            </h1>
            <p className="mt-4 text-base leading-relaxed text-hero-foreground/80 xl:text-lg">
              登录您的账户，继续探索更多可能性
            </p>
          </div>

          {/* Bottom - Features & Copyright */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-hero-foreground/10 backdrop-blur-sm ring-1 ring-hero-foreground/15">
                  <Shield className="size-4 text-hero-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hero-foreground">安全可靠</p>
                  <p className="text-xs text-hero-foreground/60">多重安全保障</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-hero-foreground/10 backdrop-blur-sm ring-1 ring-hero-foreground/15">
                  <Zap className="size-4 text-hero-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hero-foreground">高效便捷</p>
                  <p className="text-xs text-hero-foreground/60">提升工作效率</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-hero-foreground/10 backdrop-blur-sm ring-1 ring-hero-foreground/15">
                  <BarChart3 className="size-4 text-hero-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hero-foreground">数据驱动</p>
                  <p className="text-xs text-hero-foreground/60">洞察业务增长</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-hero-foreground/50">
              © 2024 Admin Dashboard. 保留所有权利。
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Form area */}
      <div className="flex w-full items-center justify-center bg-muted px-4 py-12 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
