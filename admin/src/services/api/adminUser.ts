import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  PageResult,
  AdminUserManageVO,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from '@/types/api'

/** Admin User Management API */
export const adminUserApi = {
  /** 分页查询管理员 */
  page: (params: { current?: number; size?: number; username?: string }) =>
    requestApi<PageResult<AdminUserManageVO>>(
      request.get<ApiResponse<PageResult<AdminUserManageVO>>>(
        '/api/admin/admin-users',
        { params: { current: 1, size: 10, ...params } }
      )
    ),

  /** 管理员详情(含角色) */
  getById: (id: number) =>
    requestApi<AdminUserManageVO>(
      request.get<ApiResponse<AdminUserManageVO>>(
        `/api/admin/admin-users/${id}`
      )
    ),

  /** 创建管理员 */
  create: (data: CreateAdminUserRequest) =>
    requestApi<AdminUserManageVO>(
      request.post<ApiResponse<AdminUserManageVO>>(
        '/api/admin/admin-users',
        data
      )
    ),

  /** 修改管理员 */
  update: (id: number, data: UpdateAdminUserRequest) =>
    requestApi<AdminUserManageVO>(
      request.put<ApiResponse<AdminUserManageVO>>(
        `/api/admin/admin-users/${id}`,
        data
      )
    ),

  /** 删除管理员 */
  delete: (id: number) =>
    requestApi<null>(
      request.delete<ApiResponse<null>>(`/api/admin/admin-users/${id}`)
    ),

  /** 分配角色 */
  assignRoles: (id: number, roleIds: number[]) =>
    requestApi<null>(
      request.put<ApiResponse<null>>(`/api/admin/admin-users/${id}/roles`, {
        roleIds,
      })
    ),
}
