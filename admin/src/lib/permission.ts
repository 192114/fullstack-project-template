/**
 * Check if the given permissions list contains the required permission.
 * Supports wildcard '*' (super admin has all permissions).
 */
export function hasPermission(permissions: string[], perm: string): boolean {
  if (permissions.includes('*')) return true
  return permissions.includes(perm)
}

/** Route-to-permission mapping (ordered by menu sortOrder) */
export const ROUTE_PERMISSIONS: { path: string; perm: string }[] = [
  { path: '/', perm: 'dashboard:view' },
  { path: '/admin-users', perm: 'admin-user:list' },
  { path: '/roles', perm: 'role:list' },
  { path: '/menus', perm: 'menu:list' },
  { path: '/app-users', perm: 'user:list' },
]

/**
 * Find the first route the user has permission to access.
 * Returns null if the user has no permitted routes.
 */
export function findFirstPermittedRoute(permissions: string[]): string | null {
  for (const { path, perm } of ROUTE_PERMISSIONS) {
    if (hasPermission(permissions, perm)) return path
  }
  return null
}
