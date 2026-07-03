import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, UserCheck, Activity, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

// Mock data
const statsData = [
  {
    title: '总用户数',
    value: '12,847',
    change: '+12.5%',
    icon: Users,
    trend: 'up' as const,
  },
  {
    title: '今日登录',
    value: '1,423',
    change: '+8.2%',
    icon: UserCheck,
    trend: 'up' as const,
  },
  {
    title: '系统健康',
    value: '99.9%',
    change: '+0.1%',
    icon: Activity,
    trend: 'up' as const,
  },
  {
    title: 'API 调用量',
    value: '45.2K',
    change: '+15.3%',
    icon: TrendingUp,
    trend: 'up' as const,
  },
]

const areaChartData = [
  { name: '周一', users: 120, logins: 80 },
  { name: '周二', users: 150, logins: 95 },
  { name: '周三', users: 180, logins: 120 },
  { name: '周四', users: 160, logins: 110 },
  { name: '周五', users: 200, logins: 150 },
  { name: '周六', users: 90, logins: 60 },
  { name: '周日', users: 70, logins: 45 },
]

const barChartData = [
  { name: '用户管理', calls: 4200 },
  { name: '角色管理', calls: 3100 },
  { name: '健康检查', calls: 2800 },
  { name: '报表', calls: 2200 },
  { name: '认证', calls: 5100 },
]

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="py-0">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>用户增长趋势</CardTitle>
            <CardDescription>最近一周用户注册与登录数据</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="注册用户"
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  name="登录用户"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模块 API 调用量</CardTitle>
            <CardDescription>各模块今日 API 请求次数</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#8884d8" radius={[4, 4, 0, 0]} name="调用次数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
