import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, ChevronRight, ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { HasPermission } from '@/components/HasPermission'
import { QueryState } from '@/components/business/QueryState'
import { StatusBadge } from '@/components/business/StatusBadge'
import { useAllMenus } from '@/hooks/useMenuTree'
import { queryKeys } from '@/lib/queryKeys'
import { invalidateAccess } from '@/lib/queryInvalidation'
import { menuApi } from '@/services/api/menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
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
import type { MenuTreeVO, CreateMenuRequest } from '@/types/api'

const MENU_WRITE_KEY = ['menu-write'] as const
const TYPE_LABELS: Record<number, string> = { 1: '目录', 2: '菜单', 3: '按钮' }
const menuSchema = z
  .object({
    parentId: z.number().int().nonnegative(),
    name: z.string().trim().min(1, '请输入菜单名称'),
    type: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    path: z.string().trim(),
    icon: z.string().trim(),
    sortOrder: z.number({ error: '请输入排序数字' }).int('排序必须是整数'),
    permission: z.string().trim(),
    visible: z.union([z.literal(0), z.literal(1)]),
    status: z.union([z.literal(0), z.literal(1)]),
  })
  .superRefine((value, ctx) => {
    if (value.type === 2 && !value.path)
      ctx.addIssue({ code: 'custom', path: ['path'], message: '菜单必须填写路由路径' })
    if (value.type === 3 && !value.permission)
      ctx.addIssue({ code: 'custom', path: ['permission'], message: '按钮必须填写权限标识' })
  })
type MenuForm = z.infer<typeof menuSchema>
type MenuOperation =
  { action: 'save'; id?: number; data: CreateMenuRequest } | { action: 'delete'; id: number }
const EMPTY_FORM: MenuForm = {
  parentId: 0,
  name: '',
  type: 2,
  path: '',
  icon: '',
  sortOrder: 0,
  permission: '',
  visible: 1,
  status: 1,
}

function filterTree(menus: MenuTreeVO[], search: string): MenuTreeVO[] {
  return menus.flatMap((menu) => {
    if (menu.name.toLowerCase().includes(search)) return [menu]
    const children = filterTree(menu.children ?? [], search)
    return children.length ? [{ ...menu, children }] : []
  })
}
function flattenTree(
  menus: MenuTreeVO[],
  expanded: Set<number>,
  forceExpand: boolean,
  depth = 0,
): (MenuTreeVO & { depth: number })[] {
  return menus.flatMap((menu) => [
    { ...menu, depth },
    ...(forceExpand || expanded.has(menu.id)
      ? flattenTree(menu.children ?? [], expanded, forceExpand, depth + 1)
      : []),
  ])
}
function collectParentOptions(
  menus: MenuTreeVO[],
  excludedId?: number,
  depth = 0,
): { id: number; label: string }[] {
  return menus.flatMap((menu) =>
    menu.id === excludedId || menu.type === 3
      ? []
      : [
          { id: menu.id, label: `${'　'.repeat(depth)}${menu.name}` },
          ...collectParentOptions(menu.children ?? [], excludedId, depth + 1),
        ],
  )
}

export function MenuPage() {
  const client = useQueryClient()
  const query = useAllMenus()
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const [searchName, setSearchName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuTreeVO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuTreeVO | null>(null)
  const form = useForm<MenuForm>({ resolver: zodResolver(menuSchema), defaultValues: EMPTY_FORM })
  const type = useWatch({ control: form.control, name: 'type' })
  const { errors } = form.formState
  const search = searchName.trim().toLowerCase()
  const menus = query.data ?? []
  const rows = flattenTree(search ? filterTree(menus, search) : menus, expanded, !!search)
  const parentOptions = [
    { id: 0, label: '根目录' },
    ...collectParentOptions(menus, editingMenu?.id),
  ]
  const mutation = useMutation({
    mutationKey: MENU_WRITE_KEY,
    mutationFn: async (operation: MenuOperation) => {
      if (operation.action === 'delete') return menuApi.delete(operation.id)
      return operation.id === undefined
        ? menuApi.create(operation.data)
        : menuApi.update(operation.id, operation.data)
    },
    onSuccess: async (_, operation) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.menusAll }),
        invalidateAccess(client),
      ])
      setDialogOpen(false)
      setDeleteTarget(null)
      toast.success(operation.action === 'delete' ? '菜单已删除' : '菜单已保存')
    },
    onError: (error) => toast.error(error.message),
  })
  const pending = () => client.isMutating({ mutationKey: MENU_WRITE_KEY }) > 0
  const disabled = mutation.isPending || query.isFetching
  const openForm = (menu: MenuTreeVO | null) => {
    if (pending()) return
    setEditingMenu(menu)
    form.reset(
      menu
        ? {
            parentId: menu.parentId,
            name: menu.name,
            type: menu.type as MenuForm['type'],
            path: menu.path ?? '',
            icon: menu.icon ?? '',
            sortOrder: menu.sortOrder,
            permission: menu.permission ?? '',
            visible: menu.visible as 0 | 1,
            status: menu.status as 0 | 1,
          }
        : EMPTY_FORM,
    )
    setDialogOpen(true)
  }
  const save = (values: MenuForm) => {
    if (pending()) return
    if (!parentOptions.some((option) => option.id === values.parentId)) {
      form.setError('parentId', { message: '请选择有效父菜单' })
      return
    }
    mutation.mutate({
      action: 'save',
      id: editingMenu?.id,
      data: {
        ...values,
        path: values.type === 3 ? '' : values.path,
        icon: values.type === 3 ? '' : values.icon,
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">菜单管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理系统菜单结构与权限标识</p>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            aria-label="搜索菜单名称"
            placeholder="搜索菜单名称"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full sm:w-56"
          />
          <Button variant="outline" onClick={() => setSearchName('')}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
          <div className="flex-1" />
          <HasPermission perm="menu:create">
            <Button disabled={disabled || !query.isSuccess} onClick={() => openForm(null)}>
              <Plus data-icon="inline-start" />
              新增菜单
            </Button>
          </HasPermission>
        </CardContent>
      </Card>
      <Card aria-busy={query.isFetching}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="min-w-48 pl-4">名称</TableHead>
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
              {query.isLoading || query.isError || !rows.length ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <QueryState
                      isLoading={query.isLoading}
                      isError={query.isError}
                      isEmpty={!rows.length}
                      onRetry={() => void query.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="pl-4">
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: menu.depth * 20 }}
                      >
                        {menu.children?.length ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${search || expanded.has(menu.id) ? '收起' : '展开'}${menu.name}`}
                            aria-expanded={!!search || expanded.has(menu.id)}
                            disabled={!!search}
                            onClick={() =>
                              setExpanded((prev) => {
                                const next = new Set(prev)
                                if (next.has(menu.id)) next.delete(menu.id)
                                else next.add(menu.id)
                                return next
                              })
                            }
                          >
                            {search || expanded.has(menu.id) ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        ) : (
                          <span className="w-9" />
                        )}
                        <span className="font-medium">{menu.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABELS[menu.type] ?? '未知'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{menu.path || '-'}</TableCell>
                    <TableCell>{menu.icon || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{menu.permission || '-'}</TableCell>
                    <TableCell>{menu.sortOrder}</TableCell>
                    <TableCell>
                      <StatusBadge status={menu.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <HasPermission perm="menu:update">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={() => openForm(menu)}
                          >
                            编辑
                          </Button>
                        </HasPermission>
                        <HasPermission perm="menu:delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            onClick={() => setDeleteTarget(menu)}
                          >
                            删除
                          </Button>
                        </HasPermission>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!pending()) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMenu ? '编辑菜单' : '新增菜单'}</DialogTitle>
            <DialogDescription>父菜单不能为自身、子菜单或按钮。</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={form.handleSubmit(save)} className="flex flex-col gap-5">
            <fieldset disabled={mutation.isPending} className="rounded-2xl bg-muted/40 p-4">
              <FieldGroup>
                <Controller
                  name="parentId"
                  control={form.control}
                  render={({ field }) => (
                    <Field data-invalid={!!errors.parentId}>
                      <FieldLabel htmlFor="menu-parent">父菜单</FieldLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger
                          id="menu-parent"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!errors.parentId}
                          aria-describedby="menu-parent-error"
                          className="w-full rounded-xl border-0 bg-muted!"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {parentOptions.map((option) => (
                              <SelectItem key={option.id} value={String(option.id)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError id="menu-parent-error" errors={[errors.parentId]} />
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="menu-type">菜单类型</FieldLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger
                          id="menu-type"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full rounded-xl border-0 bg-muted!"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="menu-name">菜单名称</FieldLabel>
                  <Input
                    id="menu-name"
                    {...form.register('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby="menu-name-error"
                    className="rounded-xl border-0 bg-muted!"
                  />
                  <FieldError id="menu-name-error" errors={[errors.name]} />
                </Field>
                {type !== 3 && (
                  <Field data-invalid={!!errors.path}>
                    <FieldLabel htmlFor="menu-path">
                      路由路径{type === 2 ? '（必填）' : ''}
                    </FieldLabel>
                    <Input
                      id="menu-path"
                      {...form.register('path')}
                      placeholder="如 /users"
                      aria-invalid={!!errors.path}
                      aria-describedby="menu-path-error"
                      className="rounded-xl border-0 bg-muted!"
                    />
                    <FieldError id="menu-path-error" errors={[errors.path]} />
                  </Field>
                )}
                {type !== 3 && (
                  <Field>
                    <FieldLabel htmlFor="menu-icon">图标</FieldLabel>
                    <Input
                      id="menu-icon"
                      {...form.register('icon')}
                      placeholder="如 Users"
                      className="rounded-xl border-0 bg-muted!"
                    />
                  </Field>
                )}
                <Field data-invalid={!!errors.permission}>
                  <FieldLabel htmlFor="menu-permission">
                    权限标识{type === 3 ? '（必填）' : ''}
                  </FieldLabel>
                  <Input
                    id="menu-permission"
                    {...form.register('permission')}
                    placeholder="如 user:create"
                    aria-invalid={!!errors.permission}
                    aria-describedby="menu-permission-error"
                    className="rounded-xl border-0 bg-muted!"
                  />
                  <FieldError id="menu-permission-error" errors={[errors.permission]} />
                </Field>
                <Field data-invalid={!!errors.sortOrder}>
                  <FieldLabel htmlFor="menu-sort">排序</FieldLabel>
                  <Input
                    id="menu-sort"
                    type="number"
                    {...form.register('sortOrder', { valueAsNumber: true })}
                    aria-invalid={!!errors.sortOrder}
                    aria-describedby="menu-sort-error"
                    className="rounded-xl border-0 bg-muted!"
                  />
                  <FieldError id="menu-sort-error" errors={[errors.sortOrder]} />
                </Field>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="menu-status">状态</FieldLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger
                          id="menu-status"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full rounded-xl border-0 bg-muted!"
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
                    </Field>
                  )}
                />
              </FieldGroup>
            </fieldset>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                )}
                确定
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !pending()) setDeleteTarget(null)
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除菜单</DialogTitle>
            <DialogDescription>
              确定要删除菜单「{deleteTarget?.name}
              」吗？此操作不可撤销。包含子菜单时，请先删除子菜单。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => {
                if (deleteTarget && !pending())
                  mutation.mutate({ action: 'delete', id: deleteTarget.id })
              }}
            >
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
