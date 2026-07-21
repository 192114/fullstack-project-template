import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { hasPermission } from '@/lib/permission'

interface HasPermissionProps {
  /** Required permission identifier, e.g. "admin-user:create" */
  perm: string
  children: ReactNode
  /** Optional fallback rendered when permission is denied (default: null) */
  fallback?: ReactNode
}

/**
 * Conditionally render children based on the current user's permissions.
 *
 * @example
 * <HasPermission perm="admin-user:create">
 *   <Button onClick={openCreate}>新增管理员</Button>
 * </HasPermission>
 */
export function HasPermission({ perm, children, fallback = null }: HasPermissionProps) {
  const { data: permissions } = usePermissions()

  if (!permissions || !hasPermission(permissions, perm)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
