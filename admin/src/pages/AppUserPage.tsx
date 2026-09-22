import { useState } from 'react'
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Loader2, RotateCcw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { HasPermission } from '@/components/HasPermission'
import { Pagination } from '@/components/business/Pagination'
import { QueryState } from '@/components/business/QueryState'
import { AuditStatusBadge } from '@/components/business/StatusBadge'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { queryKeys } from '@/lib/queryKeys'
import { appUserApi } from '@/services/api/appUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AppUserInfo, AuditUserRequest } from '@/types/api'

const AUDIT_KEY = ['app-user-audit'] as const
const rejectSchema = z.object({
  id: z.number(),
  remark: z.string().trim().min(1, '请输入驳回原因').max(200, '驳回原因最多 200 个字符'),
})
type AuditOperation = { id: number; data: AuditUserRequest }

export function AppUserPage() {
  const client = useQueryClient()
  const [searchUsername, setSearchUsername] = useState('')
  const [filterAuditStatus, setFilterAuditStatus] = useState('all')
  const username = useDebouncedValue(searchUsername).trim() || undefined
  const filters = {
    username,
    auditStatus: filterAuditStatus === 'all' ? undefined : Number(filterAuditStatus),
  }
  const list = usePagedQuery(queryKeys.appUsers(filters), (page, signal) =>
    appUserApi.page({ ...filters, current: page, size: 10 }, signal),
  )
  const [rejectTarget, setRejectTarget] = useState<AppUserInfo | null>(null)
  const [viewTarget, setViewTarget] = useState<AppUserInfo | null>(null)
  const form = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { id: 0, remark: '' },
  })
  const operations = useMutationState({
    filters: { mutationKey: AUDIT_KEY, status: 'pending' },
    select: (mutation) => mutation.state.variables as AuditOperation,
  })
  const pendingIds = new Set(operations.map((operation) => operation.id))
  const isPending = (id: number) =>
    client.isMutating({
      mutationKey: AUDIT_KEY,
      predicate: (mutation) => (mutation.state.variables as AuditOperation).id === id,
    }) > 0
  const mutation = useMutation({
    mutationKey: AUDIT_KEY,
    mutationFn: (operation: AuditOperation) => appUserApi.audit(operation.id, operation.data),
    onSuccess: async (_, operation) => {
      await client.invalidateQueries({ queryKey: queryKeys.appUsersRoot })
      if (operation.data.auditStatus === 2)
        setRejectTarget((current) => (current?.id === operation.id ? null : current))
      toast.success(operation.data.auditStatus === 1 ? '审核已通过' : '审核已驳回')
    },
    onError: (error) => toast.error(error.message),
  })
  const rejectPending = rejectTarget !== null && pendingIds.has(rejectTarget.id)
  const openReject = (user: AppUserInfo) => {
    if (isPending(user.id) || user.auditStatus !== 0) return
    form.reset({ id: user.id, remark: '' })
    setRejectTarget(user)
  }
  const handleReject = (values: z.infer<typeof rejectSchema>) => {
    if (!rejectTarget || values.id !== rejectTarget.id || isPending(values.id)) return
    mutation.mutate({ id: values.id, data: { auditStatus: 2, auditRemark: values.remark } })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">App 用户管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理 App 端注册用户，审核注册申请</p>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            aria-label="搜索用户名或手机号"
            placeholder="搜索用户名/手机号"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="w-full sm:w-56"
          />
          <Select value={filterAuditStatus} onValueChange={setFilterAuditStatus}>
            <SelectTrigger className="w-36" aria-label="审核状态筛选">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="0">待审核</SelectItem>
                <SelectItem value="1">已通过</SelectItem>
                <SelectItem value="2">已驳回</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchUsername('')
              setFilterAuditStatus('all')
              list.setPage(1)
            }}
          >
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </CardContent>
      </Card>
      <Card aria-busy={list.isFetching}>
        <CardContent className="p-0">
          {list.isFetching && !list.isLoading && (
            <p role="status" className="p-3 text-sm text-muted-foreground">
              正在更新列表…
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="pl-4">用户信息</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>审核状态</TableHead>
                <TableHead>驳回原因</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading || list.isError || !list.records.length ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <QueryState
                      isLoading={list.isLoading}
                      isError={list.isError}
                      isEmpty={!list.records.length}
                      onRetry={() => void list.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                list.records.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{user.nickname || user.username || '-'}</div>
                      <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <AuditStatusBadge status={user.auditStatus} />
                    </TableCell>
                    <TableCell
                      className="max-w-48 truncate text-muted-foreground"
                      title={user.auditRemark || ''}
                    >
                      {user.auditRemark || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.createTime}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {user.auditStatus === 0 && (
                          <HasPermission perm="user:audit">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pendingIds.has(user.id) || list.isFetching}
                              onClick={() => {
                                if (!isPending(user.id))
                                  mutation.mutate({ id: user.id, data: { auditStatus: 1 } })
                              }}
                            >
                              {pendingIds.has(user.id) && (
                                <Loader2 data-icon="inline-start" className="animate-spin" />
                              )}
                              通过
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pendingIds.has(user.id) || list.isFetching}
                              onClick={() => openReject(user)}
                            >
                              驳回
                            </Button>
                          </HasPermission>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingIds.has(user.id) || list.isFetching}
                          onClick={() => setViewTarget(user)}
                        >
                          <Eye data-icon="inline-start" />
                          查看
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!list.isError && (
            <div className="px-4">
              <Pagination
                current={list.page}
                total={list.total}
                totalPages={list.totalPages}
                onPageChange={list.setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && rejectTarget && !isPending(rejectTarget.id)) setRejectTarget(null)
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>驳回用户审核</DialogTitle>
            <DialogDescription>
              填写用户「{rejectTarget?.nickname || rejectTarget?.phone}
              」的驳回原因，用户将可以看到原因并重新提交。
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleReject)}
            className="flex flex-col gap-5"
          >
            <Field data-invalid={!!form.formState.errors.remark}>
              <FieldLabel htmlFor="reject-remark">驳回原因</FieldLabel>
              <textarea
                id="reject-remark"
                {...form.register('remark')}
                disabled={rejectPending}
                placeholder="请输入驳回原因"
                maxLength={200}
                aria-invalid={!!form.formState.errors.remark}
                aria-describedby="reject-remark-error"
                className="min-h-28 w-full rounded-xl bg-muted p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <FieldError id="reject-remark-error" errors={[form.formState.errors.remark]} />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={rejectPending}
                onClick={() => setRejectTarget(null)}
              >
                取消
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectPending}>
                {rejectPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
                确认驳回
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>账户信息与注册审核记录</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {viewTarget.nickname || viewTarget.username || viewTarget.phone}
                </span>
                <AuditStatusBadge status={viewTarget.auditStatus} />
              </div>
              <dl className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-4">
                {[
                  ['用户名', viewTarget.username],
                  ['手机号', viewTarget.phone],
                  ['邮箱', viewTarget.email],
                  ['驳回原因', viewTarget.auditRemark],
                  ['审核时间', viewTarget.auditTime],
                  ['注册时间', viewTarget.createTime],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
