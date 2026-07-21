# 模板工程改进计划（v2，已执行）

> 基于 `user-audit` 用户注册审核功能落地后的代码实际状态梳理，原则是优先"删减"而非"新增"：凡是当前业务用不上、纯粹为"未来可能需要"预先搭建的抽象/依赖，一律不加；已经存在但没人用的半成品，直接删除比保留更符合"简洁"目标。
>
> 以下所有条目均已按此原则实施完毕，保留清单是为了记录做过什么、以及明确"不建议做"的边界，供后续参考。

---

## P0 — 纯清理

### 1. 补根级 `.gitignore`，清理已入库的垃圾文件
- [x] 新增根级 `.gitignore`（`.DS_Store`、`.idea/`、`*.iml`）
- [x] `git rm --cached` 清理已跟踪的 10 处 `.DS_Store` 及 `native_app/.idea/*`
- [x] 删除 `backend/backend/`（未跟踪的残留 `.idea` 配置）

### 2. 删除 admin 中从未使用的空目录
- [x] 已删除 `admin/src/features/{health,report,role,user}`、`stores`、`routes`、`utils`、`components/{business,charts}`，保留现状的 `pages/` + `services/api/` 结构

### 3. 删除未接入的 `usePermissions`
- [x] 删除 `admin/src/hooks/usePermissions.ts`，以及仅被它调用的 `authApi.getPermissions()`（`admin/src/services/api/auth.ts`）。需要按钮级权限时再写。

### 4. 删除 backend 里的 `.gitkeep` 预留空包
- [x] 删除 `common/security`、`common/annotation`、`auth/security`、`user/repository`、`common/controller`

---

## P1 — 一致性修复

### 5. `AuthServiceImpl` 里审核状态判断两套写法并存
- [x] `checkAuditStatus()` 及 `register()`/`resubmit()` 中的裸整数 `0`/`2` 统一改为 `AuditStatus` 枚举比较（`AuthServiceImpl.java`）

### 6. 过时的 README
- [x] `backend/README.md`：修正为实际的 `/api/app/auth/*` + `/api/admin/*` 双前缀体系，补充审核相关接口、登录锁定说明、SQL 变更约定
- [x] `admin/README.md`：替换为项目实际的目录结构、路由约定、新增页面步骤
- [x] `native_app/README.md`：替换为 Feature-first 架构说明、`runAsyncAction` 用法

---

## P2 — 消除新增代码里的重复（用最小手段收敛，未引入新框架/新依赖）

### 7. admin `AdminUserPage.tsx` 与 `AppUserPage.tsx` 高度同构
- [x] 新增 `admin/src/hooks/usePagedQuery.ts`，收敛两个页面重复的 `page state + useQuery` 逻辑；列定义/操作栏保持独立，未抽象成通用表格组件

### 8. native_app 5 个 auth ViewModel 重复同一套 loading/error 状态机
- [x] 新增 `core/network/async_action.dart`（`runAsyncAction` + `AsyncActionResult`），收敛 `login/register/reset_password/resubmit/account_review` 五个 ViewModel 里重复的 `try/catch` 错误映射；未改动各自的 Freezed State 结构，未引入新状态管理方案

---

## P3

### 9. 登录接口防暴力破解
- [x] 新增 `common/util/LoginAttemptGuard.java`（复用 `SmsServiceImpl` 的 Redis 思路：失败计数 + TTL 锁定，非新增组件），接入 `AuthServiceImpl.loginByPassword` 与 `AdminAuthServiceImpl.login`，连续失败 5 次锁定 15 分钟。新增 `AuthResultCode.LOGIN_LOCKED` / `AdminResultCode.LOGIN_LOCKED`。

### 10. 最基础的 CI
- [x] 新增 `.github/workflows/{backend,admin,native-app}-ci.yml`，各自按 `paths` 触发，跑 lint/analyze + build；backend 因 `contextLoads()` 依赖本地 MySQL/Redis，CI 用 `-x test` 只做编译打包，不在 CI 里另起 DB 容器

### 11. 数据库变更留痕
- [x] 在 `backend/README.md` 中写明约定：后续表结构变更以 `sql/` 目录下按用途命名的增量 SQL 文件追加维护，不引入 Flyway/Liquibase

---

## 明确不做的事（保留作为边界参考）

- 不引入 Flyway/Liquibase、Prometheus/APM、集中式日志采集、i18n 框架
- 不给 backend 加独立 Repository 层
- 不把 admin 迁移到 features/ + 全局 store 结构
- 不把 native_app 的 ViewModel 收敛做成通用框架/代码生成
- 不给 admin 表格抽象成通用组件
- 不在 CI 里为 backend 起服务容器跑集成测试（当前测试覆盖率为零，属于单独的"补测试基建"任务，不在本轮范围内）
