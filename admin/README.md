# Admin 管理后台

基于 React 19 + TypeScript + Vite 的管理后台模板，使用 TanStack Router / Query、Tailwind CSS 4 和 shadcn/ui（Radix）。

## 本地开发与质量检查

要求 Node.js 22+、pnpm 10.12.2（由 `packageManager` 固定）。

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
```

- `pnpm typecheck` 使用 `tsc -b` 检查应用与工具配置，启用 TypeScript 严格模式。
- `pnpm format` 自动格式化；`format:check` 只检查。
- `pnpm test` 使用 Vitest + jsdom，覆盖权限逻辑、分页 Hook、请求拦截器与登录表单。
- CI 执行安装、Lint、类型检查、格式检查、测试和构建。
- 首页图表与指标是示例数据，不代表实时业务统计。

## 目录结构

```text
src/
├── app/                   # 应用入口、路由树、QueryClient
├── layouts/               # AuthLayout、AdminLayout
├── pages/                 # 扁平页面目录
├── components/
│   ├── ui/                # shadcn CLI 生成的基础组件
│   └── business/          # Pagination、QueryState、StatusBadge
├── services/
│   ├── api/               # adminUser、appUser、auth、menu、role
│   ├── request.ts         # Axios 拦截器与 requestApi
│   └── errors.ts          # ApiError（业务码、HTTP 状态、消息）
├── hooks/                 # 分页、搜索防抖、权限与菜单查询
├── lib/                   # queryKeys、queryInvalidation、auth、theme、permission
├── styles/                # 全局语义 Token 与明暗主题
└── types/                 # 共享接口类型
```

页面私有逻辑保留在 `pages/`，跨页面组件抽取到 `components/business/`，不额外引入 `features/` 分层。`components/ui/` 不放手写业务组件。

## 查询、表单与写操作

1. 新页面在 `src/app/router.tsx` 注册路由，后台布局与页面使用懒加载。
2. API 放在 `services/api/`，使用 `requestApi()` 提取统一响应的 `data`，失败抛出 `ApiError`。
3. 查询 key 统一使用 `lib/queryKeys.ts`；分页用 `usePagedQuery`，查询函数透传 `AbortSignal`。
4. 搜索用 `useDebouncedValue` 做 300ms 防抖。筛选参数进入 query key，变化时页码回到 1；总页数收缩时自动回退，加载占位数据不会触发回退。
5. 表单使用 React Hook Form + Zod，校验错误内联关联到字段；查询错误用 `QueryState` 提供重试；操作结果使用 `sonner` Toast。
6. 写操作使用 `useMutation`，提交期间禁用相关入口并禁止关闭弹窗，避免重复提交与对象切换。
7. 角色写操作刷新角色列表和角色选项；分配菜单刷新角色详情与访问权限。菜单写操作刷新管理树和访问权限；管理员写操作刷新管理员列表，影响自身权限时同步刷新访问权限。
8. `invalidateAccess()` 集中刷新权限、侧栏菜单及 `router.invalidate()`，使路由守卫重新校验。

## 认证与权限

- `lib/auth.ts` 的 `tokenStore` 集中读写 Token，`initSessionSync()` 处理跨标签会话切换并清理查询缓存。
- 请求发出时记录 Token 快照；401 只有在快照仍匹配当前会话时才清理并跳转登录，避免旧请求误清新会话。
- 退出先调用服务端注销接口，无论结果如何均清理当前本地会话；服务端失败时提示警告。
- `adminRoute.beforeLoad` 检查登录态并查询权限；子路由按权限跳转至 `/403`。主页无权限时转至第一个有权限的页面。
- `hasPermission()` 支持 `*`，`HasPermission` 控制按钮显示；前端权限仅用于交互，最终鉴权由后端负责。
- 未知路径显示 404，路由加载失败提供重试入口。
- 主题由 `lib/theme.ts` 管理，`index.html` 在首帧渲染前恢复主题。

## 环境变量

| 变量                | 用途                                                          |
| ------------------- | ------------------------------------------------------------- |
| `VITE_API_BASE_URL` | API 服务地址，不包含 `/api` 后缀（接口路径自带 `/api/admin`） |
| `VITE_APP_TITLE`    | 浏览器页面标题                                                |

- 开发模式的 `.env.development` 将 `VITE_API_BASE_URL` 留空，浏览器请求由 Vite `/api` 代理转发到本地 8080 端口；需先启动后端及其 MySQL、Redis 依赖。
- `pnpm build` 用于通用构建与 CI，不执行部署环境校验；不要把构建通过视为部署配置已正确。
- `pnpm build:staging` / `pnpm build:prod` 在构建前校验预发或生产配置，支持 Vite 的 `.env`、`.env.<mode>`、本地覆盖文件及进程环境变量优先级。
- 发布地址必须为非 `example.com` 占位的 HTTPS 地址，不能包含凭据、查询或片段；缺失或不合法时构建失败。
- 同源部署填写站点自身的 HTTPS Origin；独立 API 域名部署需由后端正确配置 CORS。
- 所有 `VITE_*` 变量会进入浏览器产物，禁止放入密码或服务端密钥；地址变更需要重新构建。

## Docker 与 Nginx 部署

在 `admin/` 目录构建；先将 `VITE_API_BASE_URL` 设置为实际部署地址，再执行：

```bash
docker build --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" -t admin-web .
docker run --rm -p 8081:80 admin-web
```

Dockerfile 使用 Node 22 构建、Nginx 提供静态文件，执行带环境校验的 `pnpm build:prod`。

- Nginx 为 SPA 深层路由回退到 `index.html`，该文件不缓存。
- `/assets/` 使用长期 immutable 缓存，不存在的静态资源返回 404，不回退 HTML。
- 开启文本资源 gzip 压缩。
- 默认 `/api/` 代理通过 Docker DNS 解析同一网络内名为 `backend`、端口为 8080 的服务。使用同源代理时需让两端容器加入同一 Docker 网络，或修改 `nginx.conf` 的上游地址。
- 独立 API 域名不经过该代理；TLS 在外层反向代理或网关配置，容器自身只监听 HTTP 80。
- `.dockerignore` 排除本地依赖、构建产物、本地环境覆盖文件与日志。

发布前还需在实际部署环境验证 TLS、代理、深层路由刷新及登录/退出流程。
