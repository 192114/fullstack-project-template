import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  PageResult,
  AppUserInfo,
  AuditUserRequest,
} from '@/types/api'

/** App User Management API */
export const appUserApi = {
  /** 分页查询 App 用户 */
  page: (params: {
    current?: number
    size?: number
    username?: string
    auditStatus?: number
  }) =>
    requestApi<PageResult<AppUserInfo>>(
      request.get<ApiResponse<PageResult<AppUserInfo>>>(
        '/api/admin/users',
        { params: { current: 1, size: 10, ...params } }
      )
    ),

  /** 审核用户 */
  audit: (id: number, data: AuditUserRequest) =>
    requestApi<AppUserInfo>(
      request.post<ApiResponse<AppUserInfo>>(
        `/api/admin/users/${id}/audit`,
        data
      )
    ),
}
