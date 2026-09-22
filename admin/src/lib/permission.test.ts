import { describe, expect, it } from 'vitest'
import { findFirstPermittedRoute, hasPermission } from '@/lib/permission'

describe('hasPermission', () => {
  it.each([
    { permissions: ['role:list'], required: 'role:list', expected: true },
    { permissions: ['role:list'], required: 'role:edit', expected: false },
    { permissions: ['role:list'], required: 'Role:list', expected: false },
    { permissions: ['role:*'], required: 'role:list', expected: false },
    { permissions: ['*'], required: 'unknown:action', expected: true },
    { permissions: ['role:list', '*'], required: 'menu:delete', expected: true },
    { permissions: [], required: 'role:list', expected: false },
    { permissions: [], required: '', expected: false },
  ])('$permissions 对 $required 的结果为 $expected', ({ permissions, required, expected }) => {
    expect(hasPermission(permissions, required)).toBe(expected)
  })
})

describe('findFirstPermittedRoute', () => {
  it.each([
    { permissions: [], expected: null },
    { permissions: ['role:create'], expected: null },
    { permissions: ['*'], expected: '/' },
    { permissions: ['dashboard:view'], expected: '/' },
    { permissions: ['admin-user:list'], expected: '/admin-users' },
    { permissions: ['role:list'], expected: '/roles' },
    { permissions: ['menu:list'], expected: '/menus' },
    { permissions: ['user:list'], expected: '/app-users' },
  ])('$permissions 对应首个路由 $expected', ({ permissions, expected }) => {
    expect(findFirstPermittedRoute(permissions)).toBe(expected)
  })

  it('按路由顺序而非传入权限顺序选择，且不修改权限数组', () => {
    const permissions = ['user:list', 'menu:list', 'role:list', 'admin-user:list', 'dashboard:view']
    const original = [...permissions]

    expect(findFirstPermittedRoute(permissions)).toBe('/')
    expect(findFirstPermittedRoute(permissions.slice(0, 4))).toBe('/admin-users')
    expect(findFirstPermittedRoute(permissions.slice(0, 3))).toBe('/roles')
    expect(findFirstPermittedRoute(permissions.slice(0, 2))).toBe('/menus')
    expect(permissions).toEqual(original)
  })
})
