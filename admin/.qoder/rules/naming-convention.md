# 命名规范

## 文件命名

| 类型 | 命名风格 | 示例 |
|------|---------|------|
| 组件文件 | PascalCase | `UserTable.tsx`, `LoginForm.tsx` |
| Hook 文件 | camelCase + use 前缀 | `useAuth.ts`, `useUserList.ts` |
| 工具函数 | camelCase | `formatDate.ts`, `parseToken.ts` |
| 类型定义 | camelCase | `api.ts`, `user.ts` |
| 常量文件 | camelCase | `constants.ts` |
| 样式文件 | kebab-case | `globals.css` |

## 组件命名

- 组件名使用 **PascalCase**：`UserTable`, `LoginCard`, `DashboardStats`
- 页面组件以 `Page` 结尾：`LoginPage`, `HomePage`, `UserListPage`
- 布局组件以 `Layout` 结尾：`AdminLayout`, `AuthLayout`
- Hook 以 `use` 开头：`useAuth`, `useUserList`

## 变量和函数命名

- 变量/函数：`camelCase`
- 常量：`UPPER_SNAKE_CASE`（如 `MAX_RETRY_COUNT`）
- 布尔变量：`isLoading`, `hasError`, `shouldRedirect`
- 事件处理函数：`handle` 前缀（如 `handleSubmit`, `handleLogout`）

## API 函数命名

- 查询类：`getXxx`, `listXxx`, `searchXxx`
- 创建类：`createXxx`
- 更新类：`updateXxx`
- 删除类：`deleteXxx`
- API 模块以 `Api` 结尾：`authApi`, `userApi`, `roleApi`

## CSS 类名

- 使用 TailwindCSS utility classes
- 自定义类名使用 kebab-case（尽量避免自定义类名）
- 使用 `cn()` 工具函数组合条件类名
