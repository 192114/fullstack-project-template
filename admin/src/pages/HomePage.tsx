import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Users,
  ListChecks,
  ShoppingBag,
  Package,
  UserPlus,
  Database,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'

// ======================== Metric Cards Data ========================
const metricCards = [
  {
    title: '总用户数',
    value: '12,345',
    change: '+18.2%',
    changeLabel: 'vs上周',
    icon: Users as React.ElementType | null,
    iconText: null as string | null,
    iconBg: 'bg-chart-5/10',
    iconColor: 'text-chart-5',
    sparkColor: 'var(--color-chart-5)',
    sparkData: [100, 120, 110, 130, 125, 140, 135].map((v) => ({ value: v })),
  },
  {
    title: '活跃用户数',
    value: '8,765',
    change: '+12.4%',
    changeLabel: 'vs上周',
    icon: ListChecks as React.ElementType | null,
    iconText: null as string | null,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    sparkColor: 'var(--color-success)',
    sparkData: [80, 90, 85, 100, 95, 110, 105].map((v) => ({ value: v })),
  },
  {
    title: '今日订单数',
    value: '1,234',
    change: '+8.6%',
    changeLabel: 'vs上周',
    icon: null as React.ElementType | null,
    iconText: '¥' as string | null,
    iconBg: 'bg-chart-3/10',
    iconColor: 'text-chart-3',
    sparkColor: 'var(--color-chart-3)',
    sparkData: [50, 60, 55, 70, 65, 75, 80].map((v) => ({ value: v })),
  },
  {
    title: '今日销售额',
    value: '¥56,789',
    change: '+15.3%',
    changeLabel: 'vs上周',
    icon: ShoppingBag as React.ElementType | null,
    iconText: null as string | null,
    iconBg: 'bg-chart-4/10',
    iconColor: 'text-chart-4',
    sparkColor: 'var(--color-chart-4)',
    sparkData: [200, 220, 210, 240, 230, 260, 250].map((v) => ({ value: v })),
  },
]

// ======================== Visit Trend Data ========================
const visitTrendData = [
  { date: '05-06', visits: 1200, users: 800 },
  { date: '05-07', visits: 1800, users: 1200 },
  { date: '05-08', visits: 2400, users: 1600 },
  { date: '05-09', visits: 3560, users: 2230 },
  { date: '05-10', visits: 2800, users: 1900 },
  { date: '05-11', visits: 3200, users: 2100 },
  { date: '05-12', visits: 4000, users: 2500 },
]

// ======================== User Source Data ========================
const userSourceData = [
  { name: '直接访问', value: 35.6, color: 'var(--color-chart-1)' },
  { name: '搜索引擎', value: 28.7, color: 'var(--color-chart-2)' },
  { name: '社交媒体', value: 15.4, color: 'var(--color-success)' },
  { name: '邮件营销', value: 10.3, color: 'var(--color-chart-3)' },
  { name: '其他', value: 10.0, color: 'var(--color-chart-4)' },
]

// ======================== Recent Users Data ========================
const recentUsers = [
  {
    name: '张三',
    email: 'zhangsan@example.com',
    role: '用户',
    time: '2024-05-12 14:23:45',
    status: '活跃',
  },
  {
    name: '李四',
    email: 'lisi@example.com',
    role: '编辑',
    time: '2024-05-12 13:18:22',
    status: '活跃',
  },
  {
    name: '王五',
    email: 'wangwu@example.com',
    role: '用户',
    time: '2024-05-12 11:45:21',
    status: '活跃',
  },
  {
    name: '赵六',
    email: 'zhaoliu@example.com',
    role: '管理员',
    time: '2024-05-12 10:33:11',
    status: '活跃',
  },
]

// ======================== System Notifications Data ========================
const notifications = [
  {
    icon: Package,
    title: '系统版本更新',
    desc: '系统已更新到 v2.1.0 版本',
    time: '10 分钟前',
    iconBg: 'bg-chart-5/10',
    iconColor: 'text-chart-5',
  },
  {
    icon: UserPlus,
    title: '新的用户注册',
    desc: '有 5 位新用户在过去 1 小时内注册',
    time: '1 小时前',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    icon: Database,
    title: '数据备份完成',
    desc: '系统数据备份已完成',
    time: '3 小时前',
    iconBg: 'bg-chart-3/10',
    iconColor: 'text-chart-3',
  },
  {
    icon: ShieldAlert,
    title: '安全警告',
    desc: '检测到异常登录尝试',
    time: '5 小时前',
    iconBg: 'bg-chart-4/10',
    iconColor: 'text-chart-4',
  },
]

// ======================== Custom Tooltip for Visit Trend ========================
function VisitTrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string } }>
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{payload[0].payload.date}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-1" />
          <span className="text-xs text-muted-foreground">
            访问量:{' '}
            <span className="font-semibold text-foreground">
              {payload[0].value.toLocaleString()}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-2" />
          <span className="text-xs text-muted-foreground">
            用户数:{' '}
            <span className="font-semibold text-foreground">
              {payload[1].value.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">数据概览</h1>
        <Badge variant="secondary">示例数据</Badge>
        <p className="text-sm text-muted-foreground">
          以下图表和通知仅供演示，不代表实时业务数据。
        </p>
      </div>
      {/* ======================== Metric Cards ======================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="gap-0 py-5">
              <CardContent className="px-5">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'flex size-11 items-center justify-center rounded-lg',
                      card.iconBg,
                    )}
                  >
                    {Icon ? (
                      <Icon className={cn('size-6', card.iconColor)} />
                    ) : (
                      <span className={cn('text-xl font-bold', card.iconColor)}>
                        {card.iconText}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="size-3.5" />
                    <span className="text-xs font-medium">{card.change}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.changeLabel}</p>
                </div>
                {/* Sparkline */}
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={card.sparkData}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id={`spark-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.sparkColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={card.sparkColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={card.sparkColor}
                        strokeWidth={2}
                        fill={`url(#spark-${card.title})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ======================== Charts Row ======================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Visit Trend */}
        <Card className="py-5">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">访问趋势</CardTitle>
            <TooltipProvider>
              <div className="flex flex-wrap gap-1">
                {['7', '30', '90'].map((range) => (
                  <Tooltip key={range}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} aria-label={`${range}天：演示数据，暂不支持切换`}>
                        <Button variant={range === '7' ? 'secondary' : 'ghost'} size="sm" disabled>
                          {range}天
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>演示数据，暂不支持切换时间范围</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-chart-1" />
                <span className="text-xs text-muted-foreground">访问量</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-chart-2" />
                <span className="text-xs text-muted-foreground">用户数</span>
              </div>
            </div>
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={visitTrendData}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip content={<VisitTrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="访问量"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="用户数"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Source — Donut Chart */}
        <Card className="py-5">
          <CardHeader>
            <CardTitle className="text-base">用户来源</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="size-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {userSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex min-w-40 flex-1 flex-col gap-3">
                {userSourceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================== Bottom Row: Table + Notifications ======================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Users Table */}
        <Card className="py-5">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">最新用户</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">用户</TableHead>
                  <TableHead className="text-muted-foreground">角色</TableHead>
                  <TableHead className="text-muted-foreground">注册时间</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.role}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.time}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        {user.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Notifications */}
        <Card className="py-5">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">系统通知</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {notifications.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-lg',
                        item.iconBg,
                      )}
                    >
                      <Icon className={cn('size-5', item.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
