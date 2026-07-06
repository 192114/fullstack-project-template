import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { menuApi } from '@/services/api/menu'
import { useAllMenus } from '@/hooks/useMenuTree'
import type { MenuTreeVO, CreateMenuRequest } from '@/types/api'

const TYPE_LABELS: Record<number, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
  1: { text: '目录', variant: 'secondary' },
  2: { text: '菜单', variant: 'default' },
  3: { text: '按钮', variant: 'outline' },
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">菜单管理</h2>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增菜单
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>路由路径</TableHead>
                <TableHead>图标</TableHead>
                <TableHead>权限标识</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : flatMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    暂无菜单数据
                  </TableCell>
                </TableRow>
              ) : (
                flatMenus.map((menu) => {
                  const typeInfo = TYPE_LABELS[menu.type] || { text: '未知', variant: 'outline' as const }
                  return (
                    <TableRow key={menu.id}>
                      <TableCell>
                        <div className="flex items-center gap-1" style={{ paddingLeft: `${menu.depth * 20}px` }}>
                          {menu.hasChildren ? (
                            <button onClick={() => toggleExpand(menu.id)} className="p-0.5 hover:bg-accent rounded">
                              {expanded.has(menu.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <span>{menu.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={typeInfo.variant}>{typeInfo.text}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{menu.path || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{menu.icon || '-'}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{menu.permission || '-'}</TableCell>
                      <TableCell>{menu.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={menu.status === 1 ? 'success' : 'destructive'}>
                          {menu.status === 1 ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(menu)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDelete(menu)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu ? '编辑菜单' : '新增菜单'}</DialogTitle>
            <DialogDescription>{editingMenu ? '修改菜单信息' : '创建新的菜单项'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="name">菜单名称</Label>
              <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            {form.type !== 3 && (
              <div className="space-y-2">
                <Label htmlFor="path">路由路径</Label>
                <Input id="path" value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="/users" />
              </div>
            )}
            {form.type !== 3 && (
              <div className="space-y-2">
                <Label htmlFor="icon">图标</Label>
                <Input id="icon" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="Users" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="permission">权限标识</Label>
              <Input id="permission" value={form.permission} onChange={e => setForm({ ...form, permission: e.target.value })} placeholder="user:create" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序</Label>
                <Input id="sortOrder" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
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

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除菜单「{deleteTarget?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
