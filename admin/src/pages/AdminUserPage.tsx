import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Loader2, UserCog,
  Search, RotateCcw, AlertTriangle, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination } from '@/components/ui/pagination'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import { hasPermission } from '@/lib/permission'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { adminUserApi } from '@/services/api/adminUser'
import { roleApi } from '@/services/api/role'
import type { AdminUserManageVO, CreateAdminUserRequest, UpdateAdminUserRequest, RoleVO } from '@/types/api'

/* ---------- helpers ---------- */

const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
]

function getAvatarColor(name: string): string {
  const hash = (name || '?').charCodeAt(0) || 0
  return avatarColors[hash % avatarColors.length]
}

function getRoleBadgeClass(code: string): string {
  switch (code) {
    case 'super_admin': return 'bg-purple-100 text-purple-700'
    case 'admin':      return 'bg-blue-100 text-blue-700'
    case 'editor':     return 'bg-amber-100 text-amber-700'
    default:           return 'bg-green-100 text-green-700'
  }
}

/* ---------- component ---------- */

export function AdminUserPage() {
  const queryClient = useQueryClient()
  const { data: permissions = [] } = usePermissions()
  const [searchUsername, setSearchUsername] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const {
    page, setPage, records: pagedUsers, total, totalPages, isLoading,
  } = usePagedQuery(
    ['admin-users', searchUsername],
    page => adminUserApi.page({ current: page, size: 10, username: searchUsername || undefined }),
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUserManageVO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateAdminUserRequest>({
    username: '', password: '', nickname: '', email: '', status: 1,
  })

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignUser, setAssignUser] = useState<AdminUserManageVO | null>(null)
  const [checkedRoles, setCheckedRoles] = useState<Set<number>>(new Set())
  const { data: allRoles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => roleApi.listAll(),
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserManageVO | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const openCreate = () => {
    setEditUser(null)
    setForm({ username: '', password: '', nickname: '', email: '', status: 1 })
    setDialogOpen(true)
  }

  const openEdit = (user: AdminUserManageVO) => {
    setEditUser(user)
    setForm({ username: user.username, password: '', nickname: user.nickname || '', email: user.email || '', status: user.status })
    setDialogOpen(true)
  }

  const openAssign = (user: AdminUserManageVO) => {
    setAssignUser(user)
    setCheckedRoles(new Set(user.roles.map(r => r.id)))
    setAssignDialogOpen(true)
  }

  const openDelete = (user: AdminUserManageVO) => {
    setDeleteTarget(user)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editUser) {
        const updateData: UpdateAdminUserRequest = {
          nickname: form.nickname, email: form.email, status: form.status,
        }
        await adminUserApi.update(editUser.id, updateData)
      } else {
        await adminUserApi.create(form)
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssign = async () => {
    if (!assignUser) return
    setSubmitting(true)
    try {
      await adminUserApi.assignRoles(assignUser.id, Array.from(checkedRoles))
      setAssignDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await adminUserApi.delete(deleteTarget.id)
      setDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user: AdminUserManageVO) => {
    try {
      await adminUserApi.update(user.id, {
        nickname: user.nickname || undefined,
        email: user.email || undefined,
        status: user.status === 1 ? 0 : 1,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const toggleRole = (roleId: number) => {
    setCheckedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }

  const handleReset = () => {
    setSearchUsername('')
    setFilterRole('all')
    setFilterStatus('all')
    setPage(1)
  }

  // Client-side filter for role & status (API doesn't support these yet)
  const users = pagedUsers.filter(u => {
    if (filterStatus !== 'all' && String(u.status) !== filterStatus) return false
    if (filterRole !== 'all' && !u.roles.some(r => String(r.id) === filterRole)) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">管理员列表</h1>
        <p className="mt-0.5 text-sm text-gray-500">管理系统中所有管理员账户及其角色权限</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索用户名"
                value={searchUsername}
                onChange={e => { setSearchUsername(e.target.value); setPage(1) }}
                className="w-56 pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                {allRoles?.map((r: RoleVO) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">禁用</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="size-4" />重置
            </Button>
            <div className="flex-1" />
            {hasPermission(permissions, 'admin-user:create') && (
              <Button onClick={openCreate}>
                <Plus className="size-4" />新增管理员
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={users.length > 0 && selectedIds.size === users.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>用户信息</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto size-6 animate-spin text-gray-400" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">暂无数据</TableCell></TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id} className="even:bg-gray-50/40">
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white', getAvatarColor(user.username))}>
                          {(user.nickname || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800">{user.nickname || user.username}</div>
                          <div className="text-xs text-gray-400">ID: {user.id} · {user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span key={role.id} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getRoleBadgeClass(role.code))}>
                            {role.name}
                          </span>
                        ))}
                        {user.roles.length === 0 && <span className="text-sm text-gray-400">未分配</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={cn('size-2 rounded-full', user.status === 1 ? 'bg-green-500' : 'bg-red-400')} />
                        {user.status === 1 ? '启用' : '禁用'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email || '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.createTime}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission(permissions, 'admin-user:update') && (
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            编辑
                          </button>
                        )}
                        {hasPermission(permissions, 'admin-user:update') && (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={cn(
                              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                              user.status === 1
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50',
                            )}
                          >
                            {user.status === 1 ? '禁用' : '启用'}
                          </button>
                        )}
                        {(hasPermission(permissions, 'admin-user:assign') || hasPermission(permissions, 'admin-user:delete')) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="rounded-md px-2 py-1 text-gray-400 transition-colors hover:bg-gray-100">
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              {hasPermission(permissions, 'admin-user:assign') && (
                                <DropdownMenuItem onClick={() => openAssign(user)}>
                                  <UserCog className="size-4" />分配角色
                                </DropdownMenuItem>
                              )}
                              {hasPermission(permissions, 'admin-user:delete') && (
                                <DropdownMenuItem
                                  onClick={() => openDelete(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="size-4" />删除
                                </DropdownMenuItem>
                              )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editUser ? '编辑管理员' : '新增管理员'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-0.5">
                用户名 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.username}
                disabled={!!editUser}
                placeholder="请输入用户名"
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            {!editUser && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-0.5">
                  密码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  placeholder="请输入密码"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>昵称</Label>
              <Input
                value={form.nickname}
                placeholder="请输入昵称"
                onChange={e => setForm({ ...form, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>邮箱</Label>
              <Input
                type="email"
                value={form.email}
                placeholder="请输入邮箱地址"
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {editUser && (
              <div className="space-y-1.5">
                <Label>状态</Label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === 1}
                      onChange={() => setForm({ ...form, status: 1 })}
                      className="text-primary"
                    />
                    <span className="text-sm">启用</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === 0}
                      onChange={() => setForm({ ...form, status: 0 })}
                      className="text-primary"
                    />
                    <span className="text-sm">禁用</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.username || (!editUser && !form.password)}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>分配角色 - {assignUser?.username}</DialogTitle>
            <DialogDescription>选择该管理员的角色</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {allRoles?.map((role: RoleVO) => (
              <label key={role.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                <Checkbox checked={checkedRoles.has(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                <span className="text-sm font-medium text-gray-700">{role.name}</span>
                <code className="text-xs text-gray-400">{role.code}</code>
              </label>
            ))}
            {(!allRoles || allRoles.length === 0) && (
              <p className="py-4 text-center text-sm text-gray-400">暂无角色</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>取消</Button>
            <Button onClick={handleAssign} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="size-4 text-red-600" />
              </span>
              删除管理员
            </DialogTitle>
            <DialogDescription className="pt-1">
              确定要删除管理员「{deleteTarget?.username}」吗？此操作不可撤销，删除后该用户的所有数据将无法恢复。
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white', getAvatarColor(deleteTarget.username))}>
                {(deleteTarget.nickname || deleteTarget.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-800">{deleteTarget.nickname || deleteTarget.username}</div>
                <div className="text-sm text-gray-400">{deleteTarget.email || '-'}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
