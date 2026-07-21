import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Loader2, Search, RotateCcw, Check, X, Clock, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { appUserApi } from '@/services/api/appUser'
import type { AppUserInfo } from '@/types/api'

/* ---------- helpers ---------- */

const auditStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline'; className: string }> = {
  0: { label: '待审核', variant: 'secondary', className: 'bg-amber-100 text-amber-700 border-transparent' },
  1: { label: '已通过', variant: 'success', className: '' },
  2: { label: '已驳回', variant: 'destructive', className: '' },
}

function getAuditBadge(status: number) {
  const config = auditStatusMap[status] || auditStatusMap[0]
  return (
    <Badge variant={config.variant} className={config.className}>
      {status === 0 && <Clock className="size-3" />}
      {status === 1 && <Check className="size-3" />}
      {status === 2 && <X className="size-3" />}
      {config.label}
    </Badge>
  )
}

/* ---------- component ---------- */

export function AppUserPage() {
  const queryClient = useQueryClient()
  const [searchUsername, setSearchUsername] = useState('')
  const [filterAuditStatus, setFilterAuditStatus] = useState<string>('all')

  const {
    page, setPage, records: users, total, totalPages, isLoading,
  } = usePagedQuery(
    ['app-users', searchUsername, filterAuditStatus],
    page =>
      appUserApi.page({
        current: page,
        size: 10,
        username: searchUsername || undefined,
        auditStatus: filterAuditStatus === 'all' ? undefined : Number(filterAuditStatus),
      }),
  )

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AppUserInfo | null>(null)
  const [rejectRemark, setRejectRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<AppUserInfo | null>(null)

  const handleApprove = async (user: AppUserInfo) => {
    try {
      await appUserApi.audit(user.id, { auditStatus: 1 })
      queryClient.invalidateQueries({ queryKey: ['app-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openReject = (user: AppUserInfo) => {
    setRejectTarget(user)
    setRejectRemark('')
    setRejectDialogOpen(true)
  }

  const openView = (user: AppUserInfo) => {
    setViewTarget(user)
    setViewDialogOpen(true)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectRemark.trim()) {
      alert('请输入驳回原因')
      return
    }
    setSubmitting(true)
    try {
      await appUserApi.audit(rejectTarget.id, {
        auditStatus: 2,
        auditRemark: rejectRemark.trim(),
      })
      setRejectDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['app-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setSearchUsername('')
    setFilterAuditStatus('all')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">App 用户管理</h1>
        <p className="mt-0.5 text-sm text-gray-500">管理 App 端注册用户，审核注册申请</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索用户名/手机号"
                value={searchUsername}
                onChange={e => { setSearchUsername(e.target.value); setPage(1) }}
                className="w-56 pl-9"
              />
            </div>
            <Select value={filterAuditStatus} onValueChange={(v) => { setFilterAuditStatus(v); setPage(1) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="0">待审核</SelectItem>
                <SelectItem value="1">已通过</SelectItem>
                <SelectItem value="2">已驳回</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="size-4" />重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="pl-4">用户信息</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>审核状态</TableHead>
                <TableHead>驳回原因</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto size-6 animate-spin text-gray-400" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-400">暂无数据</TableCell></TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id} className="even:bg-gray-50/40">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white')}>
                          {(user.nickname || user.username || user.phone).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800">{user.nickname || user.username || '-'}</div>
                          <div className="text-xs text-gray-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.phone}</TableCell>
                    <TableCell>{getAuditBadge(user.auditStatus)}</TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-gray-500" title={user.auditRemark || ''}>
                      {user.auditRemark || '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.createTime}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {user.auditStatus === 0 && (
                          <>
                            <button
                              onClick={() => handleApprove(user)}
                              className="rounded-md px-2.5 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => openReject(user)}
                              className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              驳回
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openView(user)}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <Eye className="size-3" />
                          查看
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-4">
            <Pagination
              current={page}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>驳回用户审核</DialogTitle>
            <DialogDescription>
              确定要驳回用户「{rejectTarget?.nickname || rejectTarget?.phone}」的注册申请吗？请填写驳回原因，用户将可以看到驳回原因并修改信息重新提交。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="flex items-center gap-0.5">
              驳回原因 <span className="text-red-500">*</span>
            </Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="请输入驳回原因..."
              value={rejectRemark}
              onChange={e => setRejectRemark(e.target.value)}
              maxLength={200}
            />
            <p className="text-right text-xs text-gray-400">{rejectRemark.length}/200</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectRemark.trim()}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              {/* User header */}
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-base font-medium text-white">
                  {(viewTarget.nickname || viewTarget.username || viewTarget.phone).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-medium text-gray-800">{viewTarget.nickname || viewTarget.username || '-'}</div>
                  <div className="text-xs text-gray-400">ID: {viewTarget.id}</div>
                </div>
                <div className="ml-auto">{getAuditBadge(viewTarget.auditStatus)}</div>
              </div>

              <Separator />

              {/* User info */}
              <div className="space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">用户名</span>
                  <span className="text-gray-800">{viewTarget.username || '-'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">手机号</span>
                  <span className="text-gray-800">{viewTarget.phone || '-'}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">邮箱</span>
                  <span className="text-gray-800">{viewTarget.email || '-'}</span>
                </div>
              </div>

              <Separator />

              {/* Audit info */}
              <div className="space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">审核状态</span>
                  <span>{getAuditBadge(viewTarget.auditStatus)}</span>
                </div>
                {viewTarget.auditRemark && (
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-gray-500">驳回原因</span>
                    <span className="text-red-600">{viewTarget.auditRemark}</span>
                  </div>
                )}
                {viewTarget.auditTime && (
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-gray-500">审核时间</span>
                    <span className="text-gray-800">{viewTarget.auditTime}</span>
                  </div>
                )}
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">注册时间</span>
                  <span className="text-gray-800">{viewTarget.createTime}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
