/**
 * API Response Types - aligned with backend {code, msg, data} structure
 */

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/** Paginated response */
export interface PageResult<T = unknown> {
  records: T[]
  total: number
  size: number
  current: number
}

/** Admin login request */
export interface AdminLoginRequest {
  username: string
  password: string
}

/** Admin login response (single token, no refresh token) */
export interface AdminLoginResponse {
  token: string
  user: AdminUserInfo
}

/** Admin user info */
export interface AdminUserInfo {
  id: number
  username: string
  nickname: string
  email: string | null
  status: number
  createTime: string
  updateTime: string
}

/** App user info (for admin user management) */
export interface AppUserInfo {
  id: number
  phone: string
  username: string
  nickname: string
  avatar: string | null
  email: string | null
  status: number
  createTime: string
  updateTime: string
}

// ======================== RBAC ========================

/** 菜单树 */
export interface MenuTreeVO {
  id: number
  parentId: number
  name: string
  type: number  // 1=目录 2=菜单 3=按钮
  path: string | null
  icon: string | null
  sortOrder: number
  permission: string | null
  visible: number
  status: number
  children: MenuTreeVO[]
}

/** 创建菜单请求 */
export interface CreateMenuRequest {
  parentId?: number
  name: string
  type: number
  path?: string
  icon?: string
  sortOrder?: number
  permission?: string
  visible?: number
  status?: number
}

/** 修改菜单请求 */
export interface UpdateMenuRequest extends CreateMenuRequest {}

/** 角色 */
export interface RoleVO {
  id: number
  name: string
  code: string
  sortOrder: number
  status: number
  remark: string | null
  createTime: string
  updateTime: string
  menuIds?: number[]
}

/** 创建角色请求 */
export interface CreateRoleRequest {
  name: string
  code: string
  sortOrder?: number
  remark?: string
}

/** 修改角色请求 */
export interface UpdateRoleRequest {
  name: string
  sortOrder?: number
  remark?: string
}

/** 管理员用户(含角色) */
export interface AdminUserManageVO {
  id: number
  username: string
  nickname: string | null
  email: string | null
  status: number
  createTime: string
  updateTime: string
  roles: AdminUserRole[]
}

export interface AdminUserRole {
  id: number
  name: string
  code: string
}

/** 创建管理员请求 */
export interface CreateAdminUserRequest {
  username: string
  password: string
  nickname?: string
  email?: string
  status?: number
}

/** 修改管理员请求 */
export interface UpdateAdminUserRequest {
  nickname?: string
  email?: string
  status?: number
}
