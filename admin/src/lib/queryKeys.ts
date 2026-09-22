export const queryKeys = {
  permissions: ['permissions'] as const,
  currentAdmin: ['current-admin'] as const,
  adminUsersRoot: ['admin-users'] as const,
  adminUsers: (filters: { username?: string; roleId?: number; status?: number } = {}) =>
    [
      'admin-users',
      filters.username ?? '',
      filters.roleId ?? null,
      filters.status ?? null,
    ] as const,
  rolesRoot: ['roles'] as const,
  roles: (filters: { name?: string; status?: number } = {}) =>
    ['roles', filters.name ?? '', filters.status ?? null] as const,
  rolesAll: ['roles-all'] as const,
  roleDetail: (id: number) => ['role-detail', id] as const,
  appUsersRoot: ['app-users'] as const,
  appUsers: (filters: { username?: string; auditStatus?: number } = {}) =>
    ['app-users', filters.username ?? '', filters.auditStatus ?? null] as const,
  menusTree: ['menu-tree'] as const,
  menusAll: ['menu-all'] as const,
}
