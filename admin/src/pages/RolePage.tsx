import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Plus, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { HasPermission } from '@/components/HasPermission'
import { Pagination } from '@/components/business/Pagination'
import { QueryState } from '@/components/business/QueryState'
import { StatusBadge } from '@/components/business/StatusBadge'
import { useAllMenus } from '@/hooks/useMenuTree'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { queryKeys } from '@/lib/queryKeys'
import { invalidateAccess } from '@/lib/queryInvalidation'
import { roleApi } from '@/services/api/role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { RoleVO, CreateRoleRequest, UpdateRoleRequest, MenuTreeVO } from '@/types/api'

const ROLE_WRITE_KEY = ['role-write'] as const
const roleSchema = z.object({
  name: z.string().trim().min(1, '请输入角色名称'),
  code: z.string().trim().min(1, '请输入角色编码'),
  sortOrder: z.number({ error: '请输入排序数字' }).int('排序必须是整数'),
  remark: z.string().trim(),
})
type RoleForm = z.infer<typeof roleSchema>
type RoleOperation =
  | { action: 'create'; data: CreateRoleRequest }
  | { action: 'update'; id: number; data: UpdateRoleRequest }
  | { action: 'delete'; id: number }

function collectAllIds(menus: MenuTreeVO[]): number[] {
  return menus.flatMap((menu) => [menu.id, ...collectAllIds(menu.children ?? [])])
}

function MenuTreeCheckbox({
  menus,
  checked,
  onToggle,
  disabled,
  depth = 0,
}: {
  menus: MenuTreeVO[]
  checked: Set<number>
  onToggle: (menu: MenuTreeVO) => void
  disabled: boolean
  depth?: number
}) {
  return menus.map((menu) => (
    <div key={menu.id}>
      <label className="flex items-center gap-2 py-2" style={{ paddingLeft: depth * 16 }}>
        <Checkbox
          checked={checked.has(menu.id)}
          disabled={disabled}
          onCheckedChange={() => onToggle(menu)}
        />
        <span className="text-sm">{menu.name}</span>
        {menu.permission && (
          <code className="text-xs text-muted-foreground">{menu.permission}</code>
        )}
      </label>
      {menu.children?.length > 0 && (
        <MenuTreeCheckbox
          menus={menu.children}
          checked={checked}
          onToggle={onToggle}
          disabled={disabled}
          depth={depth + 1}
        />
      )}
    </div>
  ))
}

function AssignRoleDialog({ role, onClose }: { role: RoleVO; onClose: () => void }) {
  const client = useQueryClient()
  const detail = useQuery({
    queryKey: queryKeys.roleDetail(role.id),
    queryFn: ({ signal }) => roleApi.getById(role.id, signal),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const menus = useAllMenus()
  const [selection, setSelection] = useState<Set<number> | null>(null)
  const checked = selection ?? new Set(detail.data?.menuIds ?? [])
  const mutation = useMutation({
    mutationKey: ROLE_WRITE_KEY,
    mutationFn: (ids: number[]) => roleApi.assignMenus(role.id, ids),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.roleDetail(role.id) }),
        client.invalidateQueries({ queryKey: queryKeys.rolesRoot }),
        client.invalidateQueries({ queryKey: queryKeys.rolesAll }),
        invalidateAccess(client),
      ])
      onClose()
      toast.success('权限已保存')
    },
    onError: (error) => toast.error(error.message),
  })
  const isLoading =
    detail.isLoading || menus.isLoading || (!detail.isFetchedAfterMount && !detail.isError)
  const isError = detail.isError || menus.isError
  const disabled =
    isLoading || isError || detail.isFetching || menus.isFetching || mutation.isPending
  const pending = () => client.isMutating({ mutationKey: ROLE_WRITE_KEY }) > 0
  const toggle = (menu: MenuTreeVO) => {
    if (disabled || pending()) return
    const next = new Set(checked)
    const ids = [menu.id, ...collectAllIds(menu.children ?? [])]
    if (next.has(menu.id)) ids.forEach((id) => next.delete(id))
    else ids.forEach((id) => next.add(id))
    setSelection(next)
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending()) onClose()
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>分配权限 - {role.name}</DialogTitle>
          <DialogDescription>选择该角色可以访问的菜单和权限</DialogDescription>
        </DialogHeader>
        <fieldset className="max-h-[50dvh] overflow-auto rounded-2xl bg-muted/50 p-4">
          <legend className="sr-only">菜单权限</legend>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!menus.data?.length}
            onRetry={() => {
              void detail.refetch()
              void menus.refetch()
            }}
          />
          {!isLoading && !isError && menus.data && (
            <MenuTreeCheckbox
              menus={menus.data}
              checked={checked}
              onToggle={toggle}
              disabled={disabled}
            />
          )}
        </fieldset>
        <DialogFooter>
          <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              if (!disabled && !pending()) mutation.mutate(Array.from(checked))
            }}
          >
            {mutation.isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RolePage() {
  const client = useQueryClient()
  const [searchName, setSearchName] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const name = useDebouncedValue(searchName).trim() || undefined
  const filters = { name, status: filterStatus === 'all' ? undefined : Number(filterStatus) }
  const list = usePagedQuery(queryKeys.roles(filters), (page, signal) =>
    roleApi.page({ ...filters, current: page, size: 10 }, signal),
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleVO | null>(null)
  const [assignRole, setAssignRole] = useState<RoleVO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleVO | null>(null)
  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', code: '', sortOrder: 0, remark: '' },
  })
  const { errors } = form.formState
  const mutation = useMutation({
    mutationKey: ROLE_WRITE_KEY,
    mutationFn: (operation: RoleOperation) => {
      if (operation.action === 'create') return roleApi.create(operation.data)
      if (operation.action === 'update') return roleApi.update(operation.id, operation.data)
      return roleApi.delete(operation.id)
    },
    onSuccess: async (_, operation) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.rolesRoot }),
        client.invalidateQueries({ queryKey: queryKeys.rolesAll }),
        client.invalidateQueries({ queryKey: queryKeys.adminUsersRoot }),
        ...(operation.action === 'delete' ? [invalidateAccess(client)] : []),
      ])
      setDialogOpen(false)
      setDeleteTarget(null)
      toast.success(operation.action === 'delete' ? '角色已删除' : '角色已保存')
    },
    onError: (error) => toast.error(error.message),
  })
  const pending = () => client.isMutating({ mutationKey: ROLE_WRITE_KEY }) > 0
  const disabled = mutation.isPending || list.isFetching
  const openForm = (role: RoleVO | null) => {
    if (pending()) return
    setEditRole(role)
    form.reset(
      role
        ? { name: role.name, code: role.code, sortOrder: role.sortOrder, remark: role.remark ?? '' }
        : { name: '', code: '', sortOrder: 0, remark: '' },
    )
    setDialogOpen(true)
  }
  const save = (values: RoleForm) => {
    if (pending()) return
    if (editRole) {
      const { name, sortOrder, remark } = values
      mutation.mutate({ action: 'update', id: editRole.id, data: { name, sortOrder, remark } })
    } else mutation.mutate({ action: 'create', data: values })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">角色管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理系统角色及菜单权限分配</p>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            aria-label="搜索角色名称"
            placeholder="搜索角色名称"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full sm:w-56"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" aria-label="状态筛选">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">禁用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchName('')
              setFilterStatus('all')
              list.setPage(1)
            }}
          >
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
          <div className="flex-1" />
          <HasPermission perm="role:create">
            <Button disabled={mutation.isPending} onClick={() => openForm(null)}>
              <Plus data-icon="inline-start" />
              新增角色
            </Button>
          </HasPermission>
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
                <TableHead className="pl-4">角色名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading || list.isError || list.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <QueryState
                      isLoading={list.isLoading}
                      isError={list.isError}
                      isEmpty={!list.records.length}
                      onRetry={() => void list.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                list.records.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="pl-4 font-medium">{role.name}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">{role.code}</code>
                    </TableCell>
                    <TableCell>{role.sortOrder}</TableCell>
                    <TableCell>
                      <StatusBadge status={role.status} />
                    </TableCell>
                    <TableCell>{role.remark || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{role.createTime}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <HasPermission perm="role:assign">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={disabled}
                            onClick={() => setAssignRole(role)}
                          >
                            权限
                          </Button>
                        </HasPermission>
                        <HasPermission perm="role:update">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={disabled}
                            onClick={() => openForm(role)}
                          >
                            编辑
                          </Button>
                        </HasPermission>
                        <HasPermission perm="role:delete">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={disabled}
                            onClick={() => setDeleteTarget(role)}
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!pending()) setDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editRole ? '编辑角色' : '新增角色'}</DialogTitle>
            <DialogDescription>填写角色信息，角色编码创建后不可修改。</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={form.handleSubmit(save)} className="flex flex-col gap-5">
            <fieldset disabled={mutation.isPending} className="rounded-2xl bg-muted/40 p-4">
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
                  <Input
                    id="role-name"
                    {...form.register('name')}
                    className="rounded-xl border-0 bg-muted!"
                    aria-invalid={!!errors.name}
                    aria-describedby="role-name-error"
                  />
                  <FieldError id="role-name-error" errors={[errors.name]} />
                </Field>
                {!editRole && (
                  <Field data-invalid={!!errors.code}>
                    <FieldLabel htmlFor="role-code">角色编码</FieldLabel>
                    <Input
                      id="role-code"
                      {...form.register('code')}
                      placeholder="如 support"
                      className="rounded-xl border-0 bg-muted!"
                      aria-invalid={!!errors.code}
                      aria-describedby="role-code-error"
                    />
                    <FieldError id="role-code-error" errors={[errors.code]} />
                  </Field>
                )}
                <Field data-invalid={!!errors.sortOrder}>
                  <FieldLabel htmlFor="role-sort">排序</FieldLabel>
                  <Input
                    id="role-sort"
                    type="number"
                    {...form.register('sortOrder', { valueAsNumber: true })}
                    className="rounded-xl border-0 bg-muted!"
                    aria-invalid={!!errors.sortOrder}
                    aria-describedby="role-sort-error"
                  />
                  <FieldError id="role-sort-error" errors={[errors.sortOrder]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role-remark">备注</FieldLabel>
                  <Input
                    id="role-remark"
                    {...form.register('remark')}
                    className="rounded-xl border-0 bg-muted!"
                  />
                </Field>
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
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                确定
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {assignRole && (
        <AssignRoleDialog
          key={assignRole.id}
          role={assignRole}
          onClose={() => setAssignRole(null)}
        />
      )}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !pending()) setDeleteTarget(null)
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除角色</DialogTitle>
            <DialogDescription>
              确定要删除角色「{deleteTarget?.name}」吗？此操作不可撤销，关联管理员将失去该角色权限。
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
