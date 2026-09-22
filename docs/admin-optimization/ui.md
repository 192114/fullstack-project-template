# Admin 工程优化 - UI 文档

> 目标工程为 **admin（React 19 + TanStack Router/Query + Tailwind 4 + shadcn/ui）**，本文档按该技术栈描述，不含 Flutter 内容。

## 页面列表

| 页面 | 路由 | 变更概述 |
|------|------|----------|
| LoginPage | /login | 接入 Zod 校验；背景图替换 WebP |
| HomePage | / | 标注示例数据；禁用无效交互；窄屏适配 |
| AdminUserPage | /admin-users | 服务端筛选、RHF 表单、useMutation、移除死选择列 |
| RolePage | /roles | 服务端筛选、分配弹窗竞态修复、RHF 表单、useMutation |
| MenuPage | /menus | 全树搜索、父级选项排除子树、RHF 表单、useMutation |
| AppUserPage | /app-users | 按行 pending 锁定、弹窗身份校验、三态渲染 |
| ForbiddenPage / NotFoundPage | /403、404 | 不变（路由兜底新增全局 error/pending） |
| AdminLayout（全局框架） | - | 登出调接口、主题切换、个人信息弹窗、侧栏 a11y |

## 全局 UI 模式（新增）

### 1. 反馈（Toast）

- 使用 shadcn `sonner`（CLI 添加，禁止手写 ui 组件），`<Toaster richColors position="top-center" />` 挂载于应用根
- **删除所有 `alert()`**：失败 → `toast.error(后端 msg 或兜底文案)`；成功操作 → `toast.success(简短确认)`
- 校验类错误在表单字段内联展示，不用 Toast

### 2. 表格三态

统一组件 `components/business/QueryState.tsx`：

- 加载：居中 Spinner（现有样式沿用）
- 空：居中"暂无数据"文案（支持自定义）
- 错误：错误文案 + 「重试」按钮（调用 `refetch`），**与空态严格区分**

### 3. 分页

`components/ui/pagination.tsx` 迁移为 `components/business/Pagination.tsx`（原目录仅存 shadcn 生成组件）：

- 前后页按钮补 `aria-label="上一页/下一页"`
- 当前页码 `aria-current="page"`
- 总页数 ≤ 1 时隐藏页码按钮组，但**保留"共 N 条数据"**
- 页码收缩时由 `usePagedQuery` 自动回退（不在 Pagination 内处理）

### 4. 路由兜底

- `defaultPendingComponent`：路由懒加载期间的居中 Spinner（登录页保持静态导入，首屏无 pending）
- `defaultErrorComponent`：错误标题 +「重试」（`router.invalidate()`）+「返回首页」；文案不暴露堆栈

### 5. 主题

- Header 主题按钮真实生效：切换 `<html class="dark">`，持久化 `localStorage['admin-theme']`，初始化在渲染前执行避免闪烁
- 页面/布局中的硬编码灰白色（`text-gray-800`、`bg-white` 等）替换为语义 Token（`text-foreground`、`bg-card`、`text-muted-foreground` 等），复用 globals.css 既有 dark 变量

## 页面详情

### 1. LoginPage（/login）

- **表单校验**: React Hook Form + `zodResolver` 接入既有 `loginSchema`（用户名 1-32、密码 6-64），错误在字段下方红字展示
- **提交**: 失败内联展示 `ApiError.msg`；成功流程不变（存 token → 清缓存 → 跳首页）
- **视觉**: 背景图换 `login-bg.webp`（≤200KB），`<img>` 保持 `alt=""` 装饰语义 + `fetchpriority="high"`

### 2. AdminUserPage（/admin-users）

- **筛选**: 角色/状态下拉改为服务端参数（`roleId`/`status`），任意筛选变更重置页码；移除客户端 `filter` 逻辑
- **搜索**: 输入 300ms 防抖后进入 queryKey；重置按钮恢复默认并回页 1
- **表单**: 新增/编辑弹窗改 RHF + Zod（用户名/密码/昵称/邮箱校验；编辑态不渲染密码字段）
- **操作**: 创建/更新/删除/分配角色/启停切换全部 `useMutation`；行内启停按钮请求期间禁用该行操作；提交中弹窗禁止关闭
- **移除**: 无批量操作的复选框列与 `selectedIds` 死代码

### 3. RolePage（/roles）

- **筛选**: 状态筛选服务端化
- **分配权限弹窗**: 菜单树数据按 `['role-detail', roleId]` 查询（弹窗打开时启用）；加载中显示 Spinner，失败显示错误 + 重试并**禁用保存**；弹窗标题角色与数据始终一致
- **表单**: 新增/编辑弹窗 RHF + Zod（name 必填、code 创建时必填、sortOrder 整数）
- **操作**: 全部 `useMutation`；成功后失效 `roles`、`roles-all`；分配菜单后追加失效 `menu-tree`、`permissions` 并 `router.invalidate()`

### 4. MenuPage（/menus）

- **搜索**: 基于全量树匹配（不依赖展开状态），命中时自动展开命中节点的祖先链
- **父级选择**: 编辑时下拉排除自身与后代子树；新增时排除按钮类型（现有逻辑保留）
- **表单**: RHF + Zod（name 必填、type 决定 path/permission 条件必填）
- **操作**: `useMutation`，成功后失效 `menus-all`、`menu-tree`、`permissions` 并 `router.invalidate()`
- **a11y**: 展开按钮补 `aria-expanded`、`aria-label`

### 5. AppUserPage（/app-users）

- **审核操作**: 通过/驳回按钮按行 pending 锁定（请求期间该行按钮禁用并显示 Spinner）
- **驳回弹窗**: 提交回调校验目标用户身份一致；提交期间禁止关闭
- **三态**: 表格接入 `QueryState`
- **搜索/筛选**: 复用防抖；auditStatus 筛选服务端化（后端已支持）

### 6. HomePage（/）

- 指标卡区域加"示例数据"角标；时间范围按钮置为禁用 + tooltip 说明
- 移除无行为的「查看全部」入口
- 图表容器窄屏自适应（图例换行、高度按断点调整）

### 7. AdminLayout（全局框架）

- **退出**: 调用 `authApi.logout()` → 清 token + Query 缓存 → 跳登录；服务端失败时 Toast 警告但仍完成本地登出
- **主题切换**: 见全局模式 5
- **个人信息**: 下拉项改为弹窗展示 `authApi.getCurrentAdmin()` 结果（用户名/昵称/邮箱/状态）
- **侧栏 a11y**: 展开箭头按钮 `aria-expanded`；折叠态 flyout 支持键盘聚焦展开（focus/blur 替代纯 hover）

## 交互逻辑（全局）

- **防重复提交**: 所有 mutation 在 pending 期间禁用触发入口；弹窗类操作 pending 期间拦截关闭
- **错误重试**: 仅查询类提供重试；mutation 失败后由用户重新触发
- **键盘可达**: 所有图标按钮具备可访问名称；分页/菜单树可 Tab + Enter 操作

## 状态管理

- 数据层统一 TanStack Query：查询 key 由 `src/lib/queryKeys.ts` 集中定义
- 写操作统一 `useMutation` + 集中失效规则（详见 task.md A3）
- UI 本地状态（弹窗开合、展开节点）保持 `useState`
- 会话状态（token、主题）经 `src/lib/auth.ts` / 主题工具集中读写，不散落 `localStorage` 直调
