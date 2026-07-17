import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Users, ListChecks, ShoppingBag,
  Package, UserPlus, Database, ShieldAlert,
  TrendingUp, ChevronRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
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
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    sparkColor: '#3B82F6',
    sparkData: [100, 120, 110, 130, 125, 140, 135].map(v => ({ value: v })),
  },
  {
    title: '活跃用户数',
    value: '8,765',
    change: '+12.4%',
    changeLabel: 'vs上周',
    icon: ListChecks as React.ElementType | null,
    iconText: null as string | null,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    sparkColor: '#22C55E',
    sparkData: [80, 90, 85, 100, 95, 110, 105].map(v => ({ value: v })),
  },
  {
    title: '今日订单数',
    value: '1,234',
    change: '+8.6%',
    changeLabel: 'vs上周',
    icon: null as React.ElementType | null,
    iconText: '¥' as string | null,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    sparkColor: '#A855F7',
    sparkData: [50, 60, 55, 70, 65, 75, 80].map(v => ({ value: v })),
  },
  {
    title: '今日销售额',
    value: '¥56,789',
    change: '+15.3%',
    changeLabel: 'vs上周',
    icon: ShoppingBag as React.ElementType | null,
    iconText: null as string | null,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    sparkColor: '#F97316',
    sparkData: [200, 220, 210, 240, 230, 260, 250].map(v => ({ value: v })),
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
  { name: '直接访问', value: 35.6, color: '#6366F1' },
  { name: '搜索引擎', value: 28.7, color: '#2DD4BF' },
  { name: '社交媒体', value: 15.4, color: '#34D399' },
  { name: '邮件营销', value: 10.3, color: '#A78BFA' },
  { name: '其他', value: 10.0, color: '#FB923C' },
]

// ======================== Recent Users Data ========================
const recentUsers = [
  { name: '张三', email: 'zhangsan@example.com', role: '用户', time: '2024-05-12 14:23:45', status: '活跃' },
  { name: '李四', email: 'lisi@example.com', role: '编辑', time: '2024-05-12 13:18:22', status: '活跃' },
  { name: '王五', email: 'wangwu@example.com', role: '用户', time: '2024-05-12 11:45:21', status: '活跃' },
  { name: '赵六', email: 'zhaoliu@example.com', role: '管理员', time: '2024-05-12 10:33:11', status: '活跃' },
]

// ======================== System Notifications Data ========================
const notifications = [
  {
    icon: Package,
    title: '系统版本更新',
    desc: '系统已更新到 v2.1.0 版本，点击查看详情',
    time: '10 分钟前',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: UserPlus,
    title: '新的用户注册',
    desc: '有 5 位新用户在过去 1 小时内注册',
    time: '1 小时前',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    icon: Database,
    title: '数据备份完成',
    desc: '系统数据备份已完成，点击查看备份详情',
    time: '3 小时前',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    icon: ShieldAlert,
    title: '安全警告',
    desc: '检测到异常登录尝试，点击查看详情',
    time: '5 小时前',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-gray-500">
        {payload[0].payload.date}
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-indigo-500" />
          <span className="text-xs text-gray-600">
            访问量: <span className="font-semibold text-gray-900">{payload[0].value.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-400" />
          <span className="text-xs text-gray-600">
            用户数: <span className="font-semibold text-gray-900">{payload[1].value.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7')

  return (
    <div className="space-y-6">
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
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="size-3.5" />
                    <span className="text-xs font-medium">{card.change}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-xs text-gray-400">{card.changeLabel}</p>
                </div>
                {/* Sparkline */}
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={card.sparkData}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={`spark-${card.title}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={card.sparkColor}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={card.sparkColor}
                            stopOpacity={0}
                          />
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">访问趋势</CardTitle>
            <div className="flex gap-1">
              {(['7', '30', '90'] as const).map((range) => (
                <button
                  key={range}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs transition-colors',
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-500 hover:bg-gray-100',
                  )}
                  onClick={() => setTimeRange(range)}
                >
                  {range}天
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs text-gray-600">访问量</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-teal-400" />
                <span className="text-xs text-gray-600">用户数</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={visitTrendData}
                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RTooltip content={<VisitTrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="访问量"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="用户数"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Source — Donut Chart */}
        <Card className="py-5">
          <CardHeader>
            <CardTitle className="text-base">用户来源</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-[200px] w-[200px] shrink-0">
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
              <div className="flex-1 space-y-3">
                {userSourceData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {item.value}%
                    </span>
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">最新用户</CardTitle>
            <button className="flex items-center gap-1 text-sm text-primary hover:underline">
              查看全部
              <ChevronRight className="size-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-500">用户</TableHead>
                  <TableHead className="text-gray-500">角色</TableHead>
                  <TableHead className="text-gray-500">注册时间</TableHead>
                  <TableHead className="text-gray-500">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.role}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.time}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">系统通知</CardTitle>
            <button className="flex items-center gap-1 text-sm text-primary hover:underline">
              查看全部
              <ChevronRight className="size-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                        <p className="text-sm font-medium text-gray-800">
                          {item.title}
                        </p>
                        <span className="text-xs text-gray-400">{item.time}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
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
