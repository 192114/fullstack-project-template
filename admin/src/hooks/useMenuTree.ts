import { useQuery } from '@tanstack/react-query'
import { menuApi } from '@/services/api/menu'
import type { MenuTreeVO } from '@/types/api'

/**
 * 获取当前用户菜单树(侧边栏用)
 * 登录后调用, 缓存 5 分钟
 */
export function useMenuTree(enabled = true) {
  return useQuery({
    queryKey: ['menu-tree'],
    queryFn: () => menuApi.tree(),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * 获取完整菜单树(管理用)
 */
export function useAllMenus(enabled = true) {
  return useQuery({
    queryKey: ['menu-all'],
    queryFn: () => menuApi.all(),
    enabled,
  })
}

/**
 * 从菜单树中查找匹配的路由
 */
export function findMenuByPath(
  menus: MenuTreeVO[],
  path: string
): MenuTreeVO | null {
  for (const menu of menus) {
    if (menu.path === path) return menu
    if (menu.children?.length) {
      const found = findMenuByPath(menu.children, path)
      if (found) return found
    }
  }
  return null
}
