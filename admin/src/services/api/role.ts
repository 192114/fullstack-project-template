import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  PageResult,
  RoleVO,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@/types/api'

/** Role API */
export const roleApi = {
  /** 分页查询角色 */
  page: (params: { current?: number; size?: number; name?: string }) =>
    requestApi<PageResult<RoleVO>>(
      request.get<ApiResponse<PageResult<RoleVO>>>('/api/admin/roles', {
        params: { current: 1, size: 10, ...params },
      })
    ),

  /** 全部角色(下拉用) */
  listAll: () =>
    requestApi<RoleVO[]>(
      request.get<ApiResponse<RoleVO[]>>('/api/admin/roles/all')
    ),

  /** 角色详情(含已选菜单ID) */
  getById: (id: number) =>
    requestApi<RoleVO>(
      request.get<ApiResponse<RoleVO>>(`/api/admin/roles/${id}`)
    ),

  /** 创建角色 */
  create: (data: CreateRoleRequest) =>
    requestApi<RoleVO>(
      request.post<ApiResponse<RoleVO>>('/api/admin/roles', data)
    ),

  /** 修改角色 */
  update: (id: number, data: UpdateRoleRequest) =>
    requestApi<RoleVO>(
      request.put<ApiResponse<RoleVO>>(`/api/admin/roles/${id}`, data)
    ),

  /** 删除角色 */
  delete: (id: number) =>
    requestApi<null>(
      request.delete<ApiResponse<null>>(`/api/admin/roles/${id}`)
    ),

  /** 分配菜单权限 */
  assignMenus: (id: number, menuIds: number[]) =>
    requestApi<null>(
      request.put<ApiResponse<null>>(`/api/admin/roles/${id}/menus`, { menuIds })
    ),
}
