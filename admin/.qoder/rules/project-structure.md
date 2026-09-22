# 项目结构规范

## 目录结构

```text
src/
├── app/                  # main.tsx、router.tsx、queryClient.ts
├── layouts/              # AdminLayout、AuthLayout
├── pages/                # 扁平页面目录，一个路由对应一个页面
├── components/
│   ├── ui/               # shadcn CLI 生成的基础组件
│   └── business/         # 跨页面复用的业务组件
├── services/
│   ├── api/              # 按接口模块组织的封装
│   ├── request.ts        # Axios 实例、拦截器与 requestApi
│   └── errors.ts         # ApiError
├── hooks/                # 分页、搜索防抖、权限等通用 Hook
├── lib/                  # queryKeys、queryInvalidation、auth、theme、permission
├── styles/               # 全局样式与语义 Token
└── types/                # 共享接口类型
```

## 规则

1. 页面与页面私有逻辑保留在 `pages/`，不为当前规模额外引入 `features/` 分层。
2. `components/ui/` 仅存放 shadcn CLI 生成的组件，不手写业务组件、不手动修改生成组件。
3. 跨页面复用的组件放在 `components/business/`，例如 `Pagination`、`QueryState`、`StatusBadge`。
4. API 封装放在 `services/api/`，响应统一经 `requestApi()` 解包，失败以 `ApiError` 保留业务码、HTTP 状态与消息。
5. 查询 key 由 `lib/queryKeys.ts` 集中定义；查询函数透传 `AbortSignal`，分页使用 `usePagedQuery`，搜索使用 `useDebouncedValue`。
6. 写操作使用 `useMutation`，提交期间禁用相关操作并拦截弹窗关闭。缓存联动集中在 `lib/queryInvalidation.ts`，权限变更需同时刷新权限、菜单及路由守卫。
7. 操作结果使用 `sonner` 的 Toast，字段校验使用 React Hook Form + Zod 的内联错误，查询失败使用 `QueryState` 提供重试入口。
8. Token 与跨标签会话同步集中在 `lib/auth.ts`，主题集中在 `lib/theme.ts`；业务页面不散落存储读写。
9. 共享类型放在 `types/`，页面私有类型就近定义。业务文件使用 TypeScript（`.tsx` / `.ts`）。
10. 样式使用 Tailwind CSS 与语义 Token，不使用 CSS Modules 或 styled-components；明暗主题保持一致的布局结构。
11. 新增页面在 `app/router.tsx` 注册，并补充所需权限校验；后台页面使用懒加载。
12. 测试文件按 `no-test-generation.md` 的授权约束创建，与被测文件同目录放置，不额外建立功能目录。
