import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Group as DropdownMenuGroup } from '@radix-ui/react-dropdown-menu'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCog,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Pagination } from '@/components/business/Pagination'
import { QueryState } from '@/components/business/QueryState'
import { StatusBadge } from '@/components/business/StatusBadge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { usePermissions } from '@/hooks/usePermissions'
import { hasPermission } from '@/lib/permission'
import { invalidateAccess } from '@/lib/queryInvalidation'
import { queryKeys } from '@/lib/queryKeys'
import { adminUserApi } from '@/services/api/adminUser'
import { roleApi } from '@/services/api/role'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminUserManageVO, CreateAdminUserRequest, UpdateAdminUserRequest } from '@/types/api'

const ADMIN_USER_MUTATION_KEY = ['admin-users', 'write'] as const
const INPUT_CLASS_NAME = 'h-11 rounded-xl border-0 bg-background! shadow-none'
const SUCCESS_MESSAGES = {
  create: '管理员已创建',
  update: '管理员已更新',
  delete: '管理员已删除',
  assignRoles: '角色已保存',
  toggleStatus: '状态已更新',
}

function getAdminUserSchema(isEditing: boolean) {
  return z.object({
    username: isEditing
      ? z.string().optional()
      : z.string().trim().min(3, '用户名至少 3 个字符').max(32, '用户名不能超过 32 个字符'),
    password: isEditing
      ? z.string().optional()
      : z
          .string()
          .min(6, '密码至少 6 个字符')
          .max(64, '密码不能超过 64 个字符')
          .refine((value) => value.trim().length > 0, '密码不能为空'),
    nickname: z.string().trim().max(64, '昵称不能超过 64 个字符'),
    email: z
      .string()
      .trim()
      .max(128, '邮箱不能超过 128 个字符')
      .refine(
        (value) => value === '' || z.email().safeParse(value).success,
        '请输入有效的邮箱地址',
      ),
    status: z.union([z.literal(0), z.literal(1)], { error: '请选择有效状态' }),
  })
}

type AdminUserFormValues = z.infer<ReturnType<typeof getAdminUserSchema>>
type AdminUserMutation =
  | { action: 'create'; data: CreateAdminUserRequest }
  | { action: 'update'; id: number; data: UpdateAdminUserRequest }
  | { action: 'delete'; id: number }
  | { action: 'assignRoles'; id: number; roleIds: number[] }
  | { action: 'toggleStatus'; id: number; status: 0 | 1 }

export function AdminUserPage() {
  const queryClient = useQueryClient()
  const { data: permissions = [] } = usePermissions()
  const canCreate = hasPermission(permissions, 'admin-user:create')
  const canUpdate = hasPermission(permissions, 'admin-user:update')
  const canAssign = hasPermission(permissions, 'admin-user:assign')
  const canDelete = hasPermission(permissions, 'admin-user:delete')
  const [searchUsername, setSearchUsername] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const debouncedUsername = useDebouncedValue(searchUsername, 300)
  const filters = {
    username: debouncedUsername.trim() || undefined,
    roleId: filterRole === 'all' ? undefined : Number(filterRole),
    status: filterStatus === 'all' ? undefined : Number(filterStatus),
  }
  const {
    page,
    setPage,
    records: users,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    isFetching,
    isPlaceholderData,
  } = usePagedQuery(queryKeys.adminUsers(filters), (page, signal) =>
    adminUserApi.page({ ...filters, current: page, size: 10 }, signal),
  )
  const rolesQuery = useQuery({
    queryKey: queryKeys.rolesAll,
    queryFn: () => roleApi.listAll(),
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUserManageVO | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignUser, setAssignUser] = useState<AdminUserManageVO | null>(null)
  const [checkedRoles, setCheckedRoles] = useState<Set<number>>(() => new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserManageVO | null>(null)
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(getAdminUserSchema(editUser !== null)),
    defaultValues: { username: '', password: '', nickname: '', email: '', status: 1 },
    mode: 'onBlur',
  })
  const { errors, isSubmitting } = form.formState
  const writeMutation = useMutation({
    mutationKey: ADMIN_USER_MUTATION_KEY,
    mutationFn: async (operation: AdminUserMutation) => {
      switch (operation.action) {
        case 'create':
          return adminUserApi.create(operation.data)
        case 'update':
          return adminUserApi.update(operation.id, operation.data)
        case 'delete':
          return adminUserApi.delete(operation.id)
        case 'assignRoles':
          return adminUserApi.assignRoles(operation.id, operation.roleIds)
        case 'toggleStatus':
          return adminUserApi.update(operation.id, { status: operation.status })
      }
    },
    onSuccess: async (_, operation) => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: queryKeys.adminUsersRoot })]
      if (
        operation.action === 'update' ||
        operation.action === 'toggleStatus' ||
        operation.action === 'assignRoles'
      ) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.currentAdmin }))
      }
      if (operation.action === 'assignRoles') invalidations.push(invalidateAccess(queryClient))
      await Promise.all(invalidations)
      if (operation.action === 'create' || operation.action === 'update') setDialogOpen(false)
      if (operation.action === 'assignRoles') setAssignDialogOpen(false)
      if (operation.action === 'delete') setDeleteDialogOpen(false)
      toast.success(SUCCESS_MESSAGES[operation.action])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '操作失败，请重试'),
  })
  const isPending = writeMutation.isPending || isSubmitting
  const areRowsDisabled = isPending || isFetching || isPlaceholderData
  const areRolesReady = rolesQuery.isSuccess && !rolesQuery.isFetching && rolesQuery.data.length > 0
  const isWritePending = () => queryClient.isMutating({ mutationKey: ADMIN_USER_MUTATION_KEY }) > 0
  const submitMutation = (operation: AdminUserMutation) => {
    if (isWritePending()) return
    writeMutation.mutate(operation)
  }

  const openCreate = () => {
    if (!canCreate || isWritePending()) return
    setEditUser(null)
    form.reset({ username: '', password: '', nickname: '', email: '', status: 1 })
    setDialogOpen(true)
  }
  const openEdit = (user: AdminUserManageVO) => {
    if (!canUpdate || areRowsDisabled || isWritePending()) return
    setEditUser(user)
    form.reset({
      nickname: user.nickname || '',
      email: user.email || '',
      status: user.status === 1 ? 1 : 0,
    })
    setDialogOpen(true)
  }
  const openAssign = (user: AdminUserManageVO) => {
    if (!canAssign || areRowsDisabled || isWritePending()) return
    setAssignUser(user)
    setCheckedRoles(new Set(user.roles.map((role) => role.id)))
    setAssignDialogOpen(true)
  }
  const openDelete = (user: AdminUserManageVO) => {
    if (!canDelete || areRowsDisabled || isWritePending()) return
    setDeleteTarget(user)
    setDeleteDialogOpen(true)
  }
  const handleSave = (values: AdminUserFormValues) => {
    if (!dialogOpen || isWritePending()) return
    const data: UpdateAdminUserRequest = {
      nickname: values.nickname,
      email: values.email,
      status: values.status,
    }
    if (editUser) {
      if (!canUpdate) return
      submitMutation({ action: 'update', id: editUser.id, data })
    } else {
      if (!canCreate) return
      submitMutation({
        action: 'create',
        data: { ...data, username: values.username ?? '', password: values.password ?? '' },
      })
    }
  }
  const handleAssign = () => {
    if (!canAssign || !assignDialogOpen || !assignUser || !areRolesReady || isWritePending()) return
    submitMutation({ action: 'assignRoles', id: assignUser.id, roleIds: Array.from(checkedRoles) })
  }
  const handleDelete = () => {
    if (!canDelete || !deleteDialogOpen || !deleteTarget || isWritePending()) return
    submitMutation({ action: 'delete', id: deleteTarget.id })
  }
  const handleToggleStatus = (user: AdminUserManageVO) => {
    if (!canUpdate || areRowsDisabled || isWritePending()) return
    submitMutation({ action: 'toggleStatus', id: user.id, status: user.status === 1 ? 0 : 1 })
  }
  const toggleRole = (roleId: number) => {
    if (!areRolesReady || isWritePending()) return
    setCheckedRoles((previous) => {
      const next = new Set(previous)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }
  const handleReset = () => {
    setSearchUsername('')
    setFilterRole('all')
    setFilterStatus('all')
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">管理员列表</h1>
        <p className="text-sm text-muted-foreground">管理系统中所有管理员账户及其角色权限</p>
      </div>

      <Card className="gap-0 rounded-2xl border-0 py-0 shadow-none">
        <CardHeader className="sr-only">
          <CardTitle>筛选管理员</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Label htmlFor="admin-user-search" className="sr-only">
                搜索用户名
              </Label>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="admin-user-search"
                placeholder="搜索用户名"
                value={searchUsername}
                onChange={(event) => setSearchUsername(event.target.value)}
                className="h-11 rounded-xl border-0 bg-muted! pl-9 shadow-none"
              />
            </div>
            <Label htmlFor="admin-user-role-filter" className="sr-only">
              角色筛选
            </Label>
            <Select
              value={filterRole}
              onValueChange={setFilterRole}
              disabled={!rolesQuery.isSuccess || rolesQuery.isFetching}
            >
              <SelectTrigger
                id="admin-user-role-filter"
                className="w-36 rounded-xl border-0 bg-muted! shadow-none data-[size=default]:h-11"
                aria-describedby={
                  rolesQuery.isLoading || rolesQuery.isError ? 'admin-user-roles-state' : undefined
                }
              >
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部角色</SelectItem>
                  {rolesQuery.data?.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Label htmlFor="admin-user-status-filter" className="sr-only">
              状态筛选
            </Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                id="admin-user-status-filter"
                className="w-32 rounded-xl border-0 bg-muted! shadow-none data-[size=default]:h-11"
              >
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              重置
            </Button>
            <div className="flex-1" />
            {canCreate && (
              <Button onClick={openCreate} disabled={isPending}>
                <Plus data-icon="inline-start" />
                新增管理员
              </Button>
            )}
          </div>
          {rolesQuery.isLoading && (
            <p
              id="admin-user-roles-state"
              role="status"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" />
              角色加载中
            </p>
          )}
          {rolesQuery.isError && (
            <div
              id="admin-user-roles-state"
              role="alert"
              className="flex items-center gap-3 text-sm text-destructive"
            >
              角色加载失败
              <Button
                variant="outline"
                size="sm"
                disabled={rolesQuery.isFetching}
                onClick={() => void rolesQuery.refetch()}
              >
                重试角色
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className="gap-0 overflow-hidden rounded-2xl border-0 py-0 shadow-none"
        aria-busy={isFetching}
      >
        <CardHeader className="sr-only">
          <CardTitle>管理员数据</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isFetching && !isLoading && !isPlaceholderData && (
            <p role="status" className="px-5 py-3 text-sm text-muted-foreground">
              正在更新列表…
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="pl-5">用户信息</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="pr-5 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isError || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <QueryState
                      isLoading={isLoading}
                      isError={isError}
                      isEmpty={users.length === 0}
                      onRetry={() => void refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="even:bg-muted/20">
                    <TableCell className="py-4 pl-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                          aria-hidden="true"
                        >
                          {(user.nickname || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">
                            {user.nickname || user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id} · {user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary" className="rounded-full">
                            {role.name}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && (
                          <span className="text-sm text-muted-foreground">未分配</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.createTime}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={areRowsDisabled}
                              onClick={() => openEdit(user)}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={areRowsDisabled}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {writeMutation.isPending &&
                                writeMutation.variables?.action === 'toggleStatus' &&
                                writeMutation.variables.id === user.id && (
                                  <Loader2 data-icon="inline-start" className="animate-spin" />
                                )}
                              {user.status === 1 ? '禁用' : '启用'}
                            </Button>
                          </>
                        )}
                        {(canAssign || canDelete) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`更多操作：${user.username}`}
                                disabled={areRowsDisabled}
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuGroup>
                                {canAssign && (
                                  <DropdownMenuItem
                                    disabled={areRowsDisabled}
                                    onSelect={() => openAssign(user)}
                                  >
                                    <UserCog />
                                    分配角色
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={areRowsDisabled}
                                    onSelect={() => openDelete(user)}
                                  >
                                    <Trash2 />
                                    删除
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && !isError && !isPlaceholderData && (
            <div className="overflow-x-auto px-5">
              <Pagination
                current={page}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isPending && !isWritePending()) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editUser ? '编辑管理员' : '新增管理员'}</DialogTitle>
            <DialogDescription>
              {editUser
                ? '更新个人资料与账户状态，用户名不可修改。'
                : '填写账户信息，为管理员创建登录账户。'}
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSave)}
            className="flex flex-col gap-6"
            aria-busy={isPending}
          >
            <fieldset
              disabled={isPending}
              className="flex min-w-0 flex-col gap-5 rounded-2xl bg-muted/40 p-5"
            >
              <legend className="sr-only">账户信息</legend>
              <h3 className="text-sm font-medium text-foreground">账户信息</h3>
              <div className="flex flex-col gap-2" data-invalid={!!errors.username}>
                <Label htmlFor="admin-user-username">
                  用户名{!editUser && <span className="text-destructive">*</span>}
                </Label>
                {editUser ? (
                  <Input
                    id="admin-user-username"
                    value={editUser.username}
                    disabled
                    className={INPUT_CLASS_NAME}
                    aria-describedby="admin-user-username-hint"
                  />
                ) : (
                  <Input
                    id="admin-user-username"
                    {...form.register('username')}
                    placeholder="请输入用户名"
                    autoComplete="off"
                    aria-required="true"
                    aria-invalid={!!errors.username}
                    aria-describedby={
                      errors.username ? 'admin-user-username-error' : 'admin-user-username-hint'
                    }
                    className={INPUT_CLASS_NAME}
                  />
                )}
                {errors.username ? (
                  <p
                    id="admin-user-username-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.username.message}
                  </p>
                ) : (
                  <p id="admin-user-username-hint" className="text-xs text-muted-foreground">
                    {editUser ? '用户名创建后不可修改' : '3–32 个字符，用于登录系统'}
                  </p>
                )}
              </div>
              {!editUser && (
                <div className="flex flex-col gap-2" data-invalid={!!errors.password}>
                  <Label htmlFor="admin-user-password">
                    密码<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-user-password"
                    type="password"
                    {...form.register('password')}
                    placeholder="请输入密码"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? 'admin-user-password-error' : 'admin-user-password-hint'
                    }
                    className={INPUT_CLASS_NAME}
                  />
                  {errors.password ? (
                    <p
                      id="admin-user-password-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {errors.password.message}
                    </p>
                  ) : (
                    <p id="admin-user-password-hint" className="text-xs text-muted-foreground">
                      6–64 个字符
                    </p>
                  )}
                </div>
              )}
              {editUser && (
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2" data-invalid={!!errors.status}>
                      <Label htmlFor="admin-user-status">账户状态</Label>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={isPending}
                      >
                        <SelectTrigger
                          id="admin-user-status"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full rounded-xl border-0 bg-background! shadow-none data-[size=default]:h-11"
                          aria-invalid={!!errors.status}
                          aria-describedby={errors.status ? 'admin-user-status-error' : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="1">启用</SelectItem>
                            <SelectItem value="0">禁用</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p
                          id="admin-user-status-error"
                          role="alert"
                          className="text-xs text-destructive"
                        >
                          {errors.status.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              )}
            </fieldset>
            <fieldset
              disabled={isPending}
              className="flex min-w-0 flex-col gap-5 rounded-2xl bg-muted/40 p-5"
            >
              <legend className="sr-only">个人资料</legend>
              <h3 className="text-sm font-medium text-foreground">个人资料</h3>
              <div className="flex flex-col gap-2" data-invalid={!!errors.nickname}>
                <Label htmlFor="admin-user-nickname">
                  昵称<span className="text-xs text-muted-foreground">选填</span>
                </Label>
                <Input
                  id="admin-user-nickname"
                  {...form.register('nickname')}
                  placeholder="请输入昵称"
                  autoComplete="off"
                  aria-invalid={!!errors.nickname}
                  aria-describedby={
                    errors.nickname ? 'admin-user-nickname-error' : 'admin-user-nickname-hint'
                  }
                  className={INPUT_CLASS_NAME}
                />
                {errors.nickname ? (
                  <p
                    id="admin-user-nickname-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.nickname.message}
                  </p>
                ) : (
                  <p id="admin-user-nickname-hint" className="text-xs text-muted-foreground">
                    最多 64 个字符
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2" data-invalid={!!errors.email}>
                <Label htmlFor="admin-user-email">
                  邮箱<span className="text-xs text-muted-foreground">选填</span>
                </Label>
                <Input
                  id="admin-user-email"
                  type="email"
                  {...form.register('email')}
                  placeholder="请输入邮箱地址"
                  autoComplete="off"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'admin-user-email-error' : undefined}
                  className={INPUT_CLASS_NAME}
                />
                {errors.email && (
                  <p id="admin-user-email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </fieldset>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  if (!isWritePending()) setDialogOpen(false)
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending || (editUser ? !canUpdate : !canCreate)}>
                {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}确定
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          if (!isPending && !isWritePending()) setAssignDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-0 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>分配角色 - {assignUser?.username}</DialogTitle>
            <DialogDescription>选择该管理员的角色</DialogDescription>
          </DialogHeader>
          <fieldset
            disabled={isPending}
            className="flex min-w-0 flex-col gap-2 rounded-2xl bg-muted/40 p-4"
            aria-busy={rolesQuery.isFetching || isPending}
          >
            <legend className="sr-only">可分配角色</legend>
            <QueryState
              isLoading={rolesQuery.isLoading}
              isError={rolesQuery.isError}
              isEmpty={rolesQuery.isSuccess && rolesQuery.data.length === 0}
              onRetry={() => void rolesQuery.refetch()}
            />
            {rolesQuery.isSuccess &&
              rolesQuery.data.map((role) => (
                <Label
                  key={role.id}
                  htmlFor={`admin-user-role-${role.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-background p-3"
                >
                  <Checkbox
                    id={`admin-user-role-${role.id}`}
                    checked={checkedRoles.has(role.id)}
                    disabled={isPending || !areRolesReady}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <span className="text-sm font-medium text-foreground">{role.name}</span>
                  <code className="ml-auto text-xs text-muted-foreground">{role.code}</code>
                </Label>
              ))}
            {rolesQuery.isFetching && !rolesQuery.isLoading && (
              <p role="status" className="text-sm text-muted-foreground">
                正在更新角色…
              </p>
            )}
          </fieldset>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                if (!isWritePending()) setAssignDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isPending || !areRolesReady || !assignUser || !canAssign}
            >
              {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isPending && !isWritePending()) setDeleteDialogOpen(open)
        }}
      >
        <DialogContent className="rounded-2xl border-0 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-4 text-destructive" />
              </span>
              删除管理员
            </DialogTitle>
            <DialogDescription>
              确定要删除管理员「{deleteTarget?.username}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                aria-hidden="true"
              >
                {(deleteTarget.nickname || deleteTarget.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {deleteTarget.nickname || deleteTarget.username}
                </div>
                <div className="text-sm text-muted-foreground">{deleteTarget.email || '-'}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                if (!isWritePending()) setDeleteDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || !deleteTarget || !canDelete}
            >
              {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
