import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { adminUserApi } from '@/services/api/adminUser'
import { roleApi } from '@/services/api/role'
import type { AdminUserManageVO, CreateAdminUserRequest, UpdateAdminUserRequest, RoleVO } from '@/types/api'

export function AdminUserPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchUsername, setSearchUsername] = useState('')

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchUsername],
    queryFn: () => adminUserApi.page({ current: page, size: 10, username: searchUsername || undefined }),
  })

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
    enabled: assignDialogOpen,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserManageVO | null>(null)

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

  const toggleRole = (roleId: number) => {
    setCheckedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const users = pageData?.records || []
  const total = pageData?.total || 0
  const totalPages = pageData?.pages || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">管理员管理</h2>
        <Button onClick={openCreate}><Plus className="size-4" />新增管理员</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="搜索用户名"
              value={searchUsername}
              onChange={e => { setSearchUsername(e.target.value); setPage(1) }}
              className="max-w-xs"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto size-6 animate-spin" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.nickname || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <Badge key={role.id} variant="secondary">{role.name}</Badge>
                        ))}
                        {user.roles.length === 0 && <span className="text-muted-foreground text-sm">-</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={user.status === 1 ? 'success' : 'destructive'}>{user.status === 1 ? '启用' : '禁用'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAssign(user)} title="分配角色">
                          <UserCog className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(user)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">共 {total} 条</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                <span className="flex items-center px-2 text-sm">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? '编辑管理员' : '新增管理员'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="au-username">用户名</Label>
              <Input id="au-username" value={form.username} disabled={!!editUser}
                onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            {!editUser && (
              <div className="space-y-2">
                <Label htmlFor="au-password">密码</Label>
                <Input id="au-password" type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="au-nickname">昵称</Label>
              <Input id="au-nickname" value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="au-email">邮箱</Label>
              <Input id="au-email" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            {editUser && (
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={String(form.status)} onValueChange={v => setForm({ ...form, status: Number(v) })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.username || (!editUser && !form.password)}>
              {submitting && <Loader2 className="size-4 animate-spin" />}确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>分配角色 - {assignUser?.username}</DialogTitle>
            <DialogDescription>选择该管理员的角色</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {allRoles?.map((role: RoleVO) => (
              <div key={role.id} className="flex items-center gap-2 py-1">
                <Checkbox checked={checkedRoles.has(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                <span className="text-sm">{role.name}</span>
                <code className="text-xs text-muted-foreground">{role.code}</code>
              </div>
            ))}
            {(!allRoles || allRoles.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无角色</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>取消</Button>
            <Button onClick={handleAssign} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除管理员「{deleteTarget?.username}」吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
