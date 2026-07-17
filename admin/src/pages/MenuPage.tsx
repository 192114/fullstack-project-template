import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus, ChevronRight, ChevronDown, Loader2,
  Search, RotateCcw, AlertTriangle, LayoutDashboard,
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
import { cn } from '@/lib/utils'
import { menuApi } from '@/services/api/menu'
import { useAllMenus } from '@/hooks/useMenuTree'
import type { MenuTreeVO, CreateMenuRequest } from '@/types/api'

const TYPE_LABELS: Record<number, { text: string; className: string }> = {
  1: { text: '目录', className: 'bg-blue-100 text-blue-700' },
  2: { text: '菜单', className: 'bg-green-100 text-green-700' },
  3: { text: '按钮', className: 'bg-gray-100 text-gray-600' },
}

interface FlatMenu extends MenuTreeVO {
  depth: number
  hasChildren: boolean
}

function flattenTree(menus: MenuTreeVO[], expanded: Set<number>, depth = 0): FlatMenu[] {
  const result: FlatMenu[] = []
  for (const menu of menus) {
    const hasChildren = menu.children && menu.children.length > 0
    result.push({ ...menu, depth, hasChildren })
    if (hasChildren && expanded.has(menu.id)) {
      result.push(...flattenTree(menu.children, expanded, depth + 1))
    }
  }
  return result
}

function collectMenuOptions(menus: MenuTreeVO[], depth = 0): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = [{ id: 0, label: '根目录' }]
  for (const menu of menus) {
    if (menu.type !== 3) {
      result.push({ id: menu.id, label: `${'　'.repeat(depth)}${menu.name}` })
      if (menu.children?.length) {
        result.push(...collectMenuOptions(menu.children, depth + 1).filter(o => o.id !== 0))
      }
    }
  }
  return result
}

export function MenuPage() {
  const queryClient = useQueryClient()
  const { data: menus, isLoading } = useAllMenus()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [searchName, setSearchName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuTreeVO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuTreeVO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateMenuRequest>({
    parentId: 0, name: '', type: 2, path: '', icon: '', sortOrder: 0,
    permission: '', visible: 1, status: 1,
  })

  const flatMenus = menus ? flattenTree(menus, expanded) : []
  const parentOptions = menus ? collectMenuOptions(menus) : [{ id: 0, label: '根目录' }]

  const toggleExpand = useCallback((id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const openCreate = () => {
    setEditingMenu(null)
    setForm({ parentId: 0, name: '', type: 2, path: '', icon: '', sortOrder: 0,
      permission: '', visible: 1, status: 1 })
    setDialogOpen(true)
  }

  const openEdit = (menu: MenuTreeVO) => {
    setEditingMenu(menu)
    setForm({
      parentId: menu.parentId, name: menu.name, type: menu.type,
      path: menu.path || '', icon: menu.icon || '', sortOrder: menu.sortOrder,
      permission: menu.permission || '', visible: menu.visible, status: menu.status,
    })
    setDialogOpen(true)
  }

  const openDelete = (menu: MenuTreeVO) => {
    setDeleteTarget(menu)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editingMenu) {
        await menuApi.update(editingMenu.id, form)
      } else {
        await menuApi.create(form)
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['menu-all'] })
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] })
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
      await menuApi.delete(deleteTarget.id)
      setDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['menu-all'] })
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] })
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setSearchName('')
  }

  // Filter by search name
  const filteredMenus = searchName
    ? flatMenus.filter(m => m.name.toLowerCase().includes(searchName.toLowerCase()))
    : flatMenus

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">菜单管理</h1>
        <p className="mt-0.5 text-sm text-gray-500">管理系统菜单结构与权限标识</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索菜单名称"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="size-4" />重置
            </Button>
            <div className="flex-1" />
            <Button onClick={openCreate}>
              <Plus className="size-4" />新增菜单
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
                <TableHead className="min-w-[200px] pl-4">名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>路由路径</TableHead>
                <TableHead>图标</TableHead>
                <TableHead>权限标识</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : filteredMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                    暂无菜单数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredMenus.map((menu) => {
                  const typeInfo = TYPE_LABELS[menu.type] || { text: '未知', className: 'bg-gray-100 text-gray-600' }
                  return (
                    <TableRow key={menu.id} className="even:bg-gray-50/40">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-1" style={{ paddingLeft: `${menu.depth * 20}px` }}>
                          {menu.hasChildren ? (
                            <button onClick={() => toggleExpand(menu.id)} className="rounded p-0.5 hover:bg-gray-100">
                              {expanded.has(menu.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <span className="font-medium text-gray-700">{menu.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', typeInfo.className)}>
                          {typeInfo.text}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">{menu.path || '-'}</TableCell>
                      <TableCell className="text-gray-500">{menu.icon || '-'}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{menu.permission || '-'}</TableCell>
                      <TableCell className="text-gray-600">{menu.sortOrder}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={cn('size-2 rounded-full', menu.status === 1 ? 'bg-green-500' : 'bg-red-400')} />
                          {menu.status === 1 ? '启用' : '禁用'}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(menu)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => openDelete(menu)}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            删除
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingMenu ? '编辑菜单' : '新增菜单'}</DialogTitle>
            <DialogDescription>{editingMenu ? '修改菜单信息' : '创建新的菜单项'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>父菜单</Label>
              <Select value={String(form.parentId)} onValueChange={v => setForm({ ...form, parentId: Number(v) })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {parentOptions.map(opt => (
                    <SelectItem key={opt.id} value={String(opt.id)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>菜单类型</Label>
              <Select value={String(form.type)} onValueChange={v => setForm({ ...form, type: Number(v) })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">目录</SelectItem>
                  <SelectItem value="2">菜单</SelectItem>
                  <SelectItem value="3">按钮</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-0.5">
                菜单名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                placeholder="请输入菜单名称"
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {form.type !== 3 && (
              <div className="space-y-1.5">
                <Label>路由路径</Label>
                <Input
                  value={form.path}
                  placeholder="如: /users"
                  onChange={e => setForm({ ...form, path: e.target.value })}
                />
              </div>
            )}
            {form.type !== 3 && (
              <div className="space-y-1.5">
                <Label>图标</Label>
                <Input
                  value={form.icon}
                  placeholder="如: Users"
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>权限标识</Label>
              <Input
                value={form.permission}
                placeholder="如: user:create"
                onChange={e => setForm({ ...form, permission: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={String(form.status)} onValueChange={v => setForm({ ...form, status: Number(v) })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              确定
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
              删除菜单
            </DialogTitle>
            <DialogDescription className="pt-1">
              确定要删除菜单「{deleteTarget?.name}」吗？此操作不可撤销，子菜单也将一并删除。
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <div className="font-medium text-gray-800">{deleteTarget.name}</div>
                <div className="text-sm text-gray-400">{deleteTarget.path || '无路径'}</div>
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
