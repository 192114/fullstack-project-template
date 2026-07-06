import request, { requestApi } from '@/services/request'
import type {
  ApiResponse,
  MenuTreeVO,
  CreateMenuRequest,
  UpdateMenuRequest,
} from '@/types/api'

/** Menu API */
export const menuApi = {
  /** 获取当前用户菜单树(侧边栏) */
  tree: () =>
    requestApi<MenuTreeVO[]>(
      request.get<ApiResponse<MenuTreeVO[]>>('/api/admin/menus/tree')
    ),

  /** 获取完整菜单树(管理用) */
  all: () =>
    requestApi<MenuTreeVO[]>(
      request.get<ApiResponse<MenuTreeVO[]>>('/api/admin/menus/all')
    ),

  /** 创建菜单 */
  create: (data: CreateMenuRequest) =>
    requestApi<MenuTreeVO>(
      request.post<ApiResponse<MenuTreeVO>>('/api/admin/menus', data)
    ),

  /** 修改菜单 */
  update: (id: number, data: UpdateMenuRequest) =>
    requestApi<MenuTreeVO>(
      request.put<ApiResponse<MenuTreeVO>>(`/api/admin/menus/${id}`, data)
    ),

  /** 删除菜单 */
  delete: (id: number) =>
    requestApi<null>(
      request.delete<ApiResponse<null>>(`/api/admin/menus/${id}`)
    ),
}
