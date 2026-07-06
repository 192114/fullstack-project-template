import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react'
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
import { roleApi } from '@/services/api/role'
import { useAllMenus } from '@/hooks/useMenuTree'
import type { RoleVO, CreateRoleRequest, UpdateRoleRequest, MenuTreeVO } from '@/types/api'

function MenuTreeCheckbox({
  menus, checked, onToggle, depth = 0,
}: {
  menus: MenuTreeVO[]
  checked: Set<number>
  onToggle: (id: number, children: MenuTreeVO[]) => void
  depth?: number
}) {
  return (
    <>
      {menus.map((menu) => (
        <div key={menu.id}>
          <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${depth * 20}px` }}>
            <Checkbox
              checked={checked.has(menu.id)}
              onCheckedChange={() => onToggle(menu.id, menu.children || [])}
            />
            <span className="text-sm">{menu.name}</span>
            {menu.permission && (
              <span className="text-xs text-muted-foreground font-mono">{menu.permission}</span>
            )}
          </div>
          {menu.children?.length ? (
            <MenuTreeCheckbox menus={menu.children} checked={checked} onToggle={onToggle} depth={depth + 1} />
          ) : null}
        </div>
      ))}
    </>
  )
}

function collectAllIds(menus: MenuTreeVO[]): number[] {
  const ids: number[] = []
  for (const menu of menus) {
    ids.push(menu.id)
    if (menu.children?.length) ids.push(...collectAllIds(menu.children))
  }
  return ids
}

export function RolePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchName, setSearchName] = useState('')

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['roles', page, searchName],
    queryFn: () => roleApi.page({ current: page, size: 10, name: searchName || undefined }),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleVO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateRoleRequest>({ name: '', code: '', sortOrder: 0, remark: '' })

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignRole, setAssignRole] = useState<RoleVO | null>(null)
  const [checkedMenus, setCheckedMenus] = useState<Set<number>>(new Set())
  const { data: allMenus } = useAllMenus(assignDialogOpen)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleVO | null>(null)

  const openCreate = () => {
    setEditRole(null)
    setForm({ name: '', code: '', sortOrder: 0, remark: '' })
    setDialogOpen(true)
  }

  const openEdit = (role: RoleVO) => {
    setEditRole(role)
    setForm({ name: role.name, sortOrder: role.sortOrder, remark: role.remark || '' })
    setDialogOpen(true)
  }

  const openAssign = async (role: RoleVO) => {
    setAssignRole(role)
    const detail = await roleApi.getById(role.id)
    setCheckedMenus(new Set(detail.menuIds || []))
    setAssignDialogOpen(true)
  }

  const openDelete = (role: RoleVO) => {
    setDeleteTarget(role)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editRole) {
        const updateData: UpdateRoleRequest = {
          name: form.name, sortOrder: form.sortOrder, remark: form.remark,
        }
        await roleApi.update(editRole.id, updateData)
      } else {
        await roleApi.create(form)
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssign = async () => {
    if (!assignRole) return
    setSubmitting(true)
    try {
      await roleApi.assignMenus(assignRole.id, Array.from(checkedMenus))
      setAssignDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleMenu = (id: number, children: MenuTreeVO[]) => {
    setCheckedMenus(prev => {
      const next = new Set(prev)
      const allIds = [id, ...collectAllIds(children)]
      if (next.has(id)) {
        allIds.forEach(i => next.delete(i))
      } else {
        allIds.forEach(i => next.add(i))
      }
      return next
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await roleApi.delete(deleteTarget.id)
      setDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const roles = pageData?.records || []
  const total = pageData?.total || 0
  const totalPages = pageData?.pages || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">角色管理</h2>
        <Button onClick={openCreate}><Plus className="size-4" />新增角色</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="搜索角色名称"
              value={searchName}
              onChange={e => { setSearchName(e.target.value); setPage(1) }}
              className="max-w-xs"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto size-6 animate-spin" /></TableCell></TableRow>
              ) : roles.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{role.code}</code></TableCell>
                    <TableCell>{role.sortOrder}</TableCell>
                    <TableCell><Badge variant={role.status === 1 ? 'success' : 'destructive'}>{role.status === 1 ? '启用' : '禁用'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{role.remark || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAssign(role)} title="分配权限">
                          <Shield className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(role)}>
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
            <DialogTitle>{editRole ? '编辑角色' : '新增角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">角色名称</Label>
              <Input id="role-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            {!editRole && (
              <div className="space-y-2">
                <Label htmlFor="role-code">角色编码</Label>
                <Input id="role-code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="support" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role-sort">排序</Label>
              <Input id="role-sort" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-remark">备注</Label>
              <Input id="role-remark" value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name || (!editRole && !form.code)}>
              {submitting && <Loader2 className="size-4 animate-spin" />}确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>分配权限 - {assignRole?.name}</DialogTitle>
            <DialogDescription>选择该角色可以访问的菜单和权限</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-3 max-h-[50vh] overflow-y-auto">
            {allMenus ? (
              <MenuTreeCheckbox menus={allMenus} checked={checkedMenus} onToggle={handleToggleMenu} />
            ) : (
              <div className="text-center py-4"><Loader2 className="mx-auto size-6 animate-spin" /></div>
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
            <DialogDescription>确定要删除角色「{deleteTarget?.name}」吗？</DialogDescription>
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
