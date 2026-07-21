# Admin 管理后台

基于 **React 19 + TypeScript + Vite** 的管理后台模板，集成 TanStack Router / Query、Tailwind CSS 4 + shadcn/ui。

## 技术栈

| 组件 | 说明 |
|------|------|
| React 19 + Vite | 前端框架与构建工具 |
| TanStack Router | 路由（手写路由树，非文件路由，见 `src/app/router.tsx`） |
| TanStack Query | 请求缓存与状态管理 |
| Tailwind CSS 4 + shadcn/ui | 样式与基础组件（基于 Radix） |
| axios | HTTP 请求，封装于 `src/services/request.ts` |
| oxlint | Lint 工具（Rust 实现，替代 ESLint） |

## 目录结构

```
src/
├── app/
│   └── router.tsx        # 路由树定义（新增页面需要在这里手动挂载路由）
├── layouts/               # 页面布局（AuthLayout 登录页、AdminLayout 后台主框架）
├── pages/                 # 业务页面，一个页面一个文件，扁平结构
├── components/
│   └── ui/                 # shadcn/ui 基础组件
├── services/
│   ├── request.ts          # axios 实例，统一处理 token 注入、401 跳转登录
│   └── api/                 # 按业务模块拆分的接口封装（adminUser/appUser/auth/menu/role）
├── hooks/                  # 通用 hooks（如 usePagedQuery 分页查询、useMenuTree 菜单树）
├── types/api.ts             # 接口类型定义
└── lib/                     # 通用工具函数
```

页面统一放在 `pages/`，不使用 `features/` 之类的按业务垂直切分结构——当前页面数量下，扁平结构更容易找到东西。

## 新增一个页面

1. 在 `src/pages/` 下新建 `XxxPage.tsx`
2. 在 `src/services/api/` 下新增或复用对应的 API 封装
3. 在 `src/app/router.tsx` 里创建 `createRoute` 并挂到 `adminRoute` 下
4. 如果涉及分页列表，优先用 `hooks/usePagedQuery.ts` 收敛 `page state + useQuery` 这部分逻辑，参考 `AdminUserPage.tsx` / `AppUserPage.tsx` 的用法

## 鉴权

### 登录校验

`adminRoute` 的 `beforeLoad` 检查 `localStorage` 中是否存在 `token`，未登录则重定向到 `/login`。

### 路由级权限

`adminRoute.beforeLoad` 在登录校验后，通过 `GET /api/admin/auth/permissions` 预取当前用户权限列表并存入路由 context。每个子路由的 `beforeLoad` 从 context 读取权限，校验对应的权限标识（如 `menu:list`），无权限则重定向到 `/403`。

权限标识与路由的映射在后端 `RbacDataInitializer` 种子数据中定义（`sys_menu` 表 type=2 的 `permission` 字段）。

### 按钮级权限

- `usePermissions` hook：基于 TanStack Query 封装，queryKey `['permissions']`，与路由 `beforeLoad` 预取共享缓存。
- `hasPermission(permissions, perm)` 工具函数：支持 `*` 通配符（超级管理员）。
- `<HasPermission perm="xxx">` 组件：无权限时不渲染 children。

在 `AdminUserPage`、`RolePage`、`MenuPage`、`AppUserPage` 的增删改按钮上已应用按钮级权限控制。

### 异常页面

- **404**：`rootRoute` 配置 `notFoundComponent`，访问不存在的路由时显示 `NotFoundPage`。
- **403**：`/403` 路由渲染 `ForbiddenPage`，路由级权限校验失败时重定向到此页面。

## 常用命令

```bash
pnpm dev              # 本地开发
pnpm build             # 生产构建
pnpm build:staging     # 预发构建（.env.staging）
pnpm build:prod        # 生产构建（.env.production）
pnpm lint              # oxlint 检查
```

如需生产级的类型感知 lint 规则，可安装 `oxlint-tsgolint` 并编辑 `.oxlintrc.json`，详见 [Oxlint 文档](https://oxc.rs/docs/guide/usage/linter/rules)。
