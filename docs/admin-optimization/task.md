# Admin 工程优化 - 执行任务清单

<!-- targets: admin,backend -->

## 目标工程

- [x] backend (Spring Boot + MyBatis-Plus)
- [x] admin (React 19 + Vite + TanStack Router/Query)

## 通用约束

1. 动手前先完整读取 `admin/.qoder/rules/` 与 `backend/.qoder/rules/` 下全部规则，子项目规则优先于根级指令
2. `admin/components/ui/` 仅存放 shadcn 生成组件，新增组件一律走 shadcn CLI；自定义业务组件放 `admin/components/business/`
3. A16（admin 测试）已获用户**明确批准**，除此任务外不得新增测试文件/测试依赖（admin 规则 no-test-generation）
4. backend 测试遵循 `backend/.qoder/rules/testing-convention.md`（JUnit5 + Mockito，禁止 @SpringBootTest）
5. backend 与 admin 两条线可并行；admin 线内任务按编号顺序执行（存在依赖时已注明）
6. 每完成一个任务将其标记为 `[x]`

---

## 后端任务 (Spring Boot)

- [x] **Task B1: 新增菜单父级校验错误码**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/auth/response/AdminResultCode.java`
  - 变更: 新增 `MENU_PARENT_NOT_FOUND(20103, "父级菜单不存在")`、`MENU_INVALID_PARENT(20104, "父级菜单不能为自身或其子菜单")`、`MENU_PARENT_TYPE_INVALID(20105, "按钮类型菜单不能作为父级")`
  - 依赖: 无
  - 参考: api.md 错误码表

- [x] **Task B2: 管理员分页支持 roleId/status 过滤**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/admin/adminuser/controller/AdminUserManageController.java`（page 增加 `@RequestParam(required = false) Long roleId`、`Integer status`）
    - `backend/src/main/java/com/shadow/backend/admin/adminuser/service/AdminUserManageService.java`
    - `backend/src/main/java/com/shadow/backend/admin/adminuser/service/impl/AdminUserManageServiceImpl.java`
  - 实现: 见 api.md 接口 1 —— `roleId` 先查 `sys_user_role` 得 userIds 再 `IN` 查询（空集合直接返回空 `PageResult`）；`status` 用 `eq`
  - 依赖: 无

- [x] **Task B3: 角色分页支持 status 过滤**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/admin/role/controller/RoleController.java`
    - `backend/src/main/java/com/shadow/backend/admin/role/service/RoleService.java`
    - `backend/src/main/java/com/shadow/backend/admin/role/service/impl/RoleServiceImpl.java`
  - 实现: 见 api.md 接口 2 —— `LambdaQueryWrapper` 增加 `eq(SysRole::getStatus, status)`（仅在不为 null 时）
  - 依赖: 无

- [x] **Task B4: 菜单 create/update 父级校验**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/menu/service/impl/MenuServiceImpl.java`
  - 实现: 抽取私有方法 `validateParent(Long parentId, Long selfId)`，规则见 api.md 接口 3/4（存在性 / type!=3 / 非 self / 非后代）；create 传 selfId=null，update 传被改菜单 id；子树判定建议沿 parent 链向上回溯至根（命中 selfId 即非法），避免全量子树构建
  - 依赖: B1

- [x] **Task B5: 后端单元测试**
  - 文件:
    - `backend/src/test/java/com/shadow/backend/admin/menu/service/impl/MenuServiceImplTest.java`（新建：父级校验全部分支——根节点跳过、父级不存在、按钮父级、self、后代成环、正常通过；沿用现有 Mockito 写法）
    - `backend/src/test/java/com/shadow/backend/admin/adminuser/service/impl/AdminUserManageServiceImplTest.java`（扩展：page 的 roleId/status 过滤分支，含"角色无关联用户返回空页"）
    - `backend/src/test/java/com/shadow/backend/admin/role/service/impl/RoleServiceImplTest.java`（扩展：page status 过滤分支）
  - 依赖: B2, B3, B4
  - 说明: 无需新增 schema.sql / 迁移脚本（domain.md 结论：无表结构变更）

---

## Admin 任务 (React + Vite)

### 阶段一：工程基线

- [x] **Task A1: 类型检查、格式化、Lint、依赖与 CI 基线**
  - 文件:
    - `admin/tsconfig.app.json`、`admin/tsconfig.node.json`（compilerOptions 增加 `"strict": true`）
    - `admin/package.json`（`typecheck` 改为 `"tsc -b"`；新增 `format`/`format:check`；新增 `packageManager: "pnpm@10.12.2"` 与 `engines.node: ">=22"`）
    - `admin/.oxlintrc.json`（新建：启用 `react`、`react-hooks` 等可用插件与项目规则，按 oxlint 1.x 实际支持裁剪）
    - `admin/.prettierrc`、`admin/.prettierignore`（新建）；安装 devDependency `prettier` 并执行一次全量 `pnpm format`
    - `admin/src/layouts/AdminLayout.tsx`（修复 `only-used-in-recursion` 告警：删除 `toggleExpand` 无效参数传递）
    - 依赖清理：移除未使用的 `@tanstack/react-table` 与 `admin/src/components/ui/sheet.tsx`（**执行前先 grep 复核确无引用**）
    - `admin/.env.development`（`VITE_API_BASE_URL=` 置空，统一走 `vite.config.ts` 的 `/api` 代理）
    - `admin/scripts/check-env.mjs`（新建：staging/production 模式下校验 `VITE_API_BASE_URL` 为 https 且不含 `example.com`，失败即退出非零）；`package.json` 的 `build:staging`/`build:prod` 前置 `node scripts/check-env.mjs`
    - `admin/src/app/main.tsx`（启动时 `document.title = import.meta.env.VITE_APP_TITLE`）
    - `.github/workflows/admin-ci.yml`（增加 `pnpm typecheck`、`pnpm format:check` 步骤；pnpm 版本由 `packageManager` 读取，`pnpm/action-setup` 无需手动 version）
  - 依赖: 无
  - 验收: `pnpm lint` 0 warning、`pnpm typecheck` 真实检查两个 tsconfig、`pnpm format:check` 通过

### 阶段二：请求层、缓存与数据 Hook

- [x] **Task A2: 错误归一化与会话治理**
  - 文件:
    - `admin/src/services/errors.ts`（新建: `ApiError extends Error`，携带 `code`(业务码)与 `status`(HTTP 状态)）
    - `admin/src/services/request.ts`（业务错误与 HTTP 错误统一 reject `ApiError` 并保留 msg；401 处理前比对"请求发出时 token 与当前 token"，不一致则仅静默 reject 不清理不跳转；请求配置支持透传 `signal`）
    - `admin/src/lib/auth.ts`（新建: token 读写/清除集中封装 + 导出 `initSessionSync()`：监听 `window.storage` 的 token 变更，变更/移除时 `queryClient.clear()` 并跳登录；`main.tsx` 调用）
    - `admin/src/app/queryClient.ts`（retry 策略: `ApiError` 4xx 不重试、请求取消不重试，网络/5xx 重试 1 次）
    - `admin/src/services/api/*.ts`（各 `page()` 增加可选 signal 透传到 axios config）
  - 依赖: A1
  - 参考: api.md 接口 5 的登出约束（登出请求不得触发 401 循环）

- [x] **Task A3: query key 注册表与缓存失效规则**
  - 文件:
    - `admin/src/lib/queryKeys.ts`（新建: `adminUsers`、`roles`、`rolesAll`、`roleDetail(id)`、`menusTree`、`menusAll`、`permissions` 等 key 工厂）
    - `admin/src/hooks/usePermissions.ts`（移除 `staleTime: Infinity`，key 改用注册表；失效后由 `router.invalidate()` 重算路由守卫）
    - `admin/src/app/router.tsx`（beforeLoad 的 `ensureQueryData` key 与注册表统一）
    - 失效规则（后续任务统一引用）: 角色增删改 → `roles` + `rolesAll`；`assignMenus` → 追加 `menusTree` + `permissions` + `router.invalidate()`；菜单增删改 → `menusAll` + `menusTree` + `permissions` + `router.invalidate()`；管理员增删改/分配角色 → `adminUsers`（若影响自身权限同样失效 `permissions` 并 `router.invalidate()`）
  - 依赖: A2

- [x] **Task A4: usePagedQuery v2 与 Pagination 迁移**
  - 文件:
    - `admin/src/hooks/usePagedQuery.ts`（透出 `error`/`isError`/`refetch`/`isFetching`；`placeholderData: keepPreviousData`；totalPages 收缩时自动 clamp 当前页；`fetchPage(page, signal)` 透传 signal）
    - `admin/src/components/ui/pagination.tsx` → 迁移为 `admin/src/components/business/Pagination.tsx`（补 `aria-label`、`aria-current="page"`；总页数 ≤1 时保留"共 N 条"仅隐藏页码组；**从 ui 目录删除原文件**）
    - `admin/src/pages/AdminUserPage.tsx`、`RolePage.tsx`、`AppUserPage.tsx`（import 路径更新）
  - 依赖: A3

### 阶段三：全局 UI 组件与路由

- [x] **Task A5: Toast、表格三态与状态徽章**
  - 文件:
    - shadcn CLI 添加 `sonner`（生成 `admin/src/components/ui/sonner.tsx`；如 CLI 引入 `next-themes` 而项目未用，改为 `<Toaster theme={...}>` 直传避免多余依赖）；`admin/src/app/main.tsx` 挂载 `<Toaster richColors position="top-center" />`
    - `admin/src/components/business/QueryState.tsx`（新建: 加载/空/错误+重试三态，见 ui.md 全局模式 2）
    - `admin/src/components/business/StatusBadge.tsx`（新建: status / auditStatus / 角色徽章收敛，类名使用语义 Token）
    - 全局替换 `alert()` → `toast.error`（AppUserPage、AdminUserPage、RolePage、MenuPage 内 10 处）
  - 依赖: A2

- [x] **Task A6: 路由懒加载与 error/pending 兜底**
  - 文件: `admin/src/app/router.tsx`
  - 变更: admin 子路由（Home/Menu/Role/AdminUser/AppUser/Forbidden）改 `lazyRouteComponent(() => import('@/pages/XxxPage'), 'XxxPage')`；LoginPage 保持静态导入；`createRouter` 增加 `defaultPendingComponent`（Spinner）与 `defaultErrorComponent`（错误文案 + 重试 `router.invalidate()` + 返回首页）
  - 依赖: 无（与阶段二并行安全）
  - 验收: `pnpm build` 后记录各 chunk 体积（与基线 1053KB 单包对比），写入任务完成备注
  - 完成备注: 基线单包 1053.36KB(gzip 314.24KB) → 登录入口 index 533.21KB(gzip 166.94KB)，后台布局也已懒加载；HomePage 含 recharts 为 389.33KB(gzip 110.92KB)，各管理页约 8-20KB 独立 chunk。Vite 仍提示入口未压缩 chunk 超过 500KB，未通过提高阈值掩盖警告。

### 阶段四：页面改造（每页完成后本地浏览器冒烟）

- [x] **Task A7: LoginPage 与认证视觉**
  - 文件: `admin/src/pages/LoginPage.tsx`、`admin/src/layouts/AuthLayout.tsx`、`admin/public/`
  - 变更: `zodResolver`（`@hookform/resolvers/zod`）接入既有 `loginSchema`，字段错误内联展示；`login-bg.png` 压缩转 `login-bg.webp`（≤200KB、宽 ≤1600px，可用 `pnpm dlx sharp-cli` 一次性转换）后删除 PNG，`<img>` 增加 `fetchpriority="high"`
  - 依赖: A5

- [ ] **Task A8: AdminUserPage 改造**
  - 文件: `admin/src/pages/AdminUserPage.tsx`
  - 变更（见 ui.md 页面详情 2）:
    - 筛选服务端化: queryKey `['admin-users', username, roleId, status]`（依赖 B2 上线前的本地联调可用 mock 或先合并后端分支）；移除客户端 filter 与 `selectedIds`/复选框死代码
    - 搜索 300ms 防抖（输入态/查询态分离）
    - 新增/编辑弹窗改 RHF + Zod（编辑态无密码字段）
    - create/update/delete/assignRoles/toggleStatus 全部 `useMutation`；行内启停 pending 锁定；弹窗提交期间拦截关闭
  - 依赖: A2, A3, A4, A5；联调依赖 B2

- [ ] **Task A9: RolePage 改造**
  - 文件: `admin/src/pages/RolePage.tsx`
  - 变更（见 ui.md 页面详情 3）:
    - 状态筛选服务端化（依赖 B3）；角色名搜索 300ms 防抖（与 A8 同模式）
    - 分配弹窗竞态修复: 详情改 `useQuery({ queryKey: queryKeys.roleDetail(role.id), enabled: assignDialogOpen })`；菜单树加载中 Spinner / 失败错误+重试且禁用保存
    - 表单 RHF + Zod；全部 `useMutation`；失效规则按 A3（assignMenus 后 `menusTree`/`permissions` + `router.invalidate()`）
  - 依赖: A2, A3, A4, A5；联调依赖 B3

- [ ] **Task A10: MenuPage 改造**
  - 文件: `admin/src/pages/MenuPage.tsx`
  - 变更（见 ui.md 页面详情 4）:
    - 搜索改为全树匹配并自动展开命中节点祖先链（不再遍历 `flatMenus`）
    - 父级选项排除自身与后代子树（与后端 B4 校验对齐）
    - 表单 RHF + Zod（type=2 时 path 必填等条件校验）
    - 全部 `useMutation` + A3 失效规则；展开按钮补 `aria-expanded`/`aria-label`
  - 依赖: A2, A3, A4, A5

- [ ] **Task A11: AppUserPage 改造**
  - 文件: `admin/src/pages/AppUserPage.tsx`
  - 变更（见 ui.md 页面详情 5）: 通过/驳回按行 pending 锁定（`useMutation` + `variables` 判定当前行）；驳回弹窗提交回调校验目标身份、提交期间拦截关闭；表格三态接入 `QueryState`；搜索防抖
  - 依赖: A2, A3, A4, A5

- [ ] **Task A12: AdminLayout 登出、主题与个人信息**
  - 文件: `admin/src/layouts/AdminLayout.tsx`、`admin/src/lib/theme.ts`（新建）、`admin/index.html`
  - 变更:
    - `handleLogout`: 先 `authApi.logout()`（失败 `toast.warning` 但仍清理本地）→ 清 token/缓存 → 跳登录
    - 主题: `lib/theme.ts` 读写 `admin-theme` 并切换 `<html class="dark">`；`index.html` 内联一小段渲染前初始化脚本防闪烁；Header 主题按钮按当前态渲染 Sun/Moon 并带 `aria-label`
    - 个人信息下拉项改为弹窗展示 `authApi.getCurrentAdmin()`
    - 折叠菜单 flyout 支持 focus 展开（键盘可达）；展开按钮补 `aria-expanded`
  - 依赖: A5

- [ ] **Task A13: HomePage 演示标识与响应式**
  - 文件: `admin/src/pages/HomePage.tsx`
  - 变更: 指标卡区"示例数据"角标；时间范围按钮禁用 + tooltip；移除「查看全部」；图表图例窄屏换行、容器高度按断点自适应
  - 依赖: 无硬依赖（建议在 A6 后验证图表分包加载）

### 阶段五：主题统一、测试、部署与文档

- [ ] **Task A14: 语义 Token 与暗色走查**
  - 文件: `admin/src/pages/*.tsx`、`admin/src/layouts/*.tsx`、`admin/src/components/business/*.tsx`
  - 变更: 硬编码 `text-gray-800`/`bg-white` 等替换为 `text-foreground`/`bg-card`/`text-muted-foreground` 等语义类（globals.css 既有变量）；完成后以亮/暗两种主题逐页浏览器走查（截图留档）
  - 依赖: A7-A13、A12（主题切换可用）

- [x] **Task A15: 部署配置**
  - 文件（新建）: `admin/Dockerfile`（多阶段: node:22-alpine `pnpm build:prod` → nginx:alpine）、`admin/nginx.conf`（`try_files ... /index.html` SPA 回退；`/assets/` 长缓存 immutable；index 不缓存；开启 gzip；代理 `/api` 说明）、`admin/.dockerignore`
  - 依赖: A1（构建脚本就绪）
  - 完成备注: Docker 构建通过 ARG 接收真实 HTTPS API Origin，执行发布环境校验；同源代理需与 backend 容器处于同一 Docker 网络。

- [x] **Task A16: admin 单元测试（用户已批准，范围最小化）**
  - 文件:
    - `admin/vitest.config.ts`（新建；**注意**: vite 8/rolldown 下若 vitest 继承 vite.config 出现兼容问题，则使用独立配置不继承；jsdom 环境）
    - devDependencies: `vitest`、`jsdom`、`@testing-library/react`、`@testing-library/jest-dom`
    - 测试: `admin/src/lib/permission.test.ts`（hasPermission 通配/精确/空、findFirstPermittedRoute）、`admin/src/hooks/usePagedQuery.test.tsx`（页码 clamp、错误透出、keepPreviousData）、`admin/src/services/request.test.ts`（mock axios adapter: 业务码归一化、401 token 比对、HTTP 错误 msg 提取）、`admin/src/pages/LoginPage.test.tsx`（zodResolver 校验渲染）
    - `admin/package.json` 增加 `"test": "vitest run"`；`.github/workflows/admin-ci.yml` 增加 `pnpm test` 步骤
  - 依赖: A2, A4, A7；且相关页面任务（A8-A11）完成后编写才不易返工
  - 约束: 仅纯逻辑与 Hook 层，不写 E2E；若 vitest 与 vite 8 实测不兼容且无解决方案，**暂停并向用户报告**而非强行引入替代框架

- [x] **Task A17: 规范与 README 口径统一**
  - 文件: `admin/.qoder/rules/project-structure.md`、`admin/README.md`
  - 变更: 统一目录口径（维持扁平 `pages/` + `components/business/` 复用，登记 `lib/queryKeys.ts`、`services/errors.ts`、mutation/失效规则、Toast 规范）；README 补充 `typecheck`/`format`/`test` 命令、环境变量与部署说明
  - 依赖: A1-A14（在最终结构定型后执行）
  - 完成备注: 目录、缓存联动、错误反馈与会话规则已统一；明确通用构建与发布构建区别、VITE 变量公开性及 Docker 代理/TLS 条件。

- [ ] **Task A18: 全量验证与收尾**
  - 步骤:
    - `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build`（admin）
    - backend `./gradlew test`（或项目现有测试命令）全绿
    - 启动本地前后端，浏览器冒烟: 登录（含校验错误）、筛选服务端化、末页删除回退、角色分配切换无串单、审核防重复、退出调 logout、暗色切换、403/404、跨标签登出同步
    - 记录构建产物体积对比（基线: 单包 1053.36KB / gzip 314.24KB）
  - 依赖: 全部任务

---

## 当前验证记录（2026-09-22）

- A8-A13 代码已实现并完成完整文件复核；角色分配加载失败时的重试按钮已修复，不再被父级 fieldset 连带禁用。逐页浏览器交互验收尚未完成，因此相关任务保留未勾选。
- admin 最终门禁 `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build` 全部通过；Lint 为 0 warning / 0 error。4 个测试文件共 65 项通过（权限 17、分页 9、请求/会话/重试 29、登录 10），Vitest 5 与 Vite 8 的独立配置兼容；CI 已接入测试。`git diff --check` 通过。
- backend `./gradlew test`：227 项测试通过，0 失败、0 错误、0 跳过。
- 发布环境校验：有效 HTTPS、占位域名、HTTP、凭据、查询参数、片段及非法地址共 7 个场景通过。
- 登录 WebP 背景为 43,064 字节，1254 × 1254，符合体积与尺寸目标。
- `nginx:1.27-alpine` 本地镜像的配置语法与 HTTP 验证通过：深层路由返回 HTML 且不缓存、JS 返回 immutable 缓存及 gzip、缺失静态资源返回 404。完整 Dockerfile 镜像构建尚未验证。
- 浏览器 `take_snapshot` 被权限检查拦截（提示引用历史“仅输出文本”限制），未绕过；亮暗主题截图、窄屏、角色切换、防重复审核、末页删除、跨标签登出等最终浏览器验收仍待完成。
- 本次另启后端时 8080 已被现有进程占用；未停止该进程，现有服务 `/actuator/health` 返回 UP。

## 依赖关系总览

```
backend: B1 → B4 → B5；B2、B3 → B5
admin:   A1 → A2 → A3 → A4 ┐
                          ├→ A8/A9/A10/A11（页面）→ A14
              A5（依赖 A2）┘
              A6（独立）；A7（依赖 A5）
              A12（依赖 A5）；A13（建议在 A6 后）
              A15（依赖 A1）；A16（依赖 A2/A4/A7 及页面任务）；A17 → A18
```
