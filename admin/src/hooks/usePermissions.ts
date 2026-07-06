import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/services/api/auth'

/**
 * 获取当前登录管理员的权限列表
 * 用于前端按钮级权限控制
 */
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => authApi.getPermissions(),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 检查是否拥有指定权限
 * @param permissions 当前用户的权限列表
 * @param permission 要检查的权限标识
 */
export function hasPermission(
  permissions: string[] | undefined,
  permission: string
): boolean {
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * 检查是否拥有任意一个权限
 */
export function hasAnyPermission(
  permissions: string[] | undefined,
  ...checks: string[]
): boolean {
  if (!permissions) return false
  return checks.some(p => permissions.includes(p))
}
