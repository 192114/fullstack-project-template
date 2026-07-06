import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Loader2, Shield,
  Search, RotateCcw, AlertTriangle,
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
import { cn } from '@/lib/utils'
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
              <span className="text-xs text-gray-400 font-mono">{menu.permission}</span>
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
  const [filterStatus, setFilterStatus] = useState<string>('all')

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

  const handleReset = () => {
    setSearchName('')
    setFilterStatus('all')
    setPage(1)
  }

  // Client-side filter for status
  const roles = (pageData?.records || []).filter(r => {
    if (filterStatus !== 'all' && String(r.status) !== filterStatus) return false
    return true
  })
  const total = pageData?.total || 0
  const totalPages = pageData?.pages || 0

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">角色管理</h1>
        <p className="mt-0.5 text-sm text-gray-500">管理系统角色及菜单权限分配</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索角色名称"
                value={searchName}
                onChange={e => { setSearchName(e.target.value); setPage(1) }}
                className="w-56 pl-9"
              />
            </div>
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
            <Button onClick={openCreate}>
              <Plus className="size-4" />新增角色
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
                <TableHead className="pl-4">角色名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto size-6 animate-spin text-gray-400" /></TableCell></TableRow>
              ) : roles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-400">暂无数据</TableCell></TableRow>
              ) : (
                roles.map(role => (
                  <TableRow key={role.id} className="even:bg-gray-50/40">
                    <TableCell className="pl-4 font-medium text-gray-800">{role.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{role.code}</code>
                    </TableCell>
                    <TableCell className="text-gray-600">{role.sortOrder}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={cn('size-2 rounded-full', role.status === 1 ? 'bg-green-500' : 'bg-red-400')} />
                        {role.status === 1 ? '启用' : '禁用'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">{role.remark || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{role.createTime}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openAssign(role)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          权限
                        </button>
                        <button
                          onClick={() => openEdit(role)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => openDelete(role)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          删除
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editRole ? '编辑角色' : '新增角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-0.5">
                角色名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                placeholder="请输入角色名称"
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {!editRole && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-0.5">
                  角色编码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.code}
                  placeholder="如: support"
                  onChange={e => setForm({ ...form, code: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input
                value={form.remark}
                placeholder="请输入备注信息"
                onChange={e => setForm({ ...form, remark: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name || (!editRole && !form.code)}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>分配权限 - {assignRole?.name}</DialogTitle>
            <DialogDescription>选择该角色可以访问的菜单和权限</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-gray-100 p-3">
            {allMenus ? (
              <MenuTreeCheckbox menus={allMenus} checked={checkedMenus} onToggle={handleToggleMenu} />
            ) : (
              <div className="py-4 text-center"><Loader2 className="mx-auto size-6 animate-spin text-gray-400" /></div>
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
              删除角色
            </DialogTitle>
            <DialogDescription className="pt-1">
              确定要删除角色「{deleteTarget?.name}」吗？此操作不可撤销，删除后关联的管理员将失去该角色权限。
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <Shield className="size-5" />
              </div>
              <div>
                <div className="font-medium text-gray-800">{deleteTarget.name}</div>
                <div className="text-sm text-gray-400">{deleteTarget.code}</div>
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
