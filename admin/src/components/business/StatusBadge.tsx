import { cn } from '@/lib/utils'

type Tone = 'success' | 'warning' | 'destructive' | 'neutral'

const toneClasses: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

const statusConfig: Record<number, { label: string; tone: Tone }> = {
  1: { label: '启用', tone: 'success' },
  0: { label: '禁用', tone: 'neutral' },
}

const auditStatusConfig: Record<number, { label: string; tone: Tone }> = {
  0: { label: '待审核', tone: 'warning' },
  1: { label: '已通过', tone: 'success' },
  2: { label: '已驳回', tone: 'destructive' },
}

function BadgeDot({ tone }: { tone: Tone }) {
  const dotClasses: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    neutral: 'bg-muted-foreground/60',
  }
  return <span className={cn('size-1.5 shrink-0 rounded-full', dotClasses[tone])} />
}

function BaseBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      <BadgeDot tone={tone} />
      {label}
    </span>
  )
}

/** 启用/禁用状态徽章（管理员、角色、菜单通用） */
export function StatusBadge({ status, className }: { status: number; className?: string }) {
  const config = statusConfig[status] ?? { label: '未知', tone: 'neutral' as Tone }
  return <BaseBadge label={config.label} tone={config.tone} className={className} />
}

/** App 用户审核状态徽章：0 待审核 / 1 已通过 / 2 已驳回 */
export function AuditStatusBadge({ status, className }: { status: number; className?: string }) {
  const config = auditStatusConfig[status] ?? { label: '未知', tone: 'neutral' as Tone }
  return <BaseBadge label={config.label} tone={config.tone} className={className} />
}
