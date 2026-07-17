# 模板工程改进计划

> 基于对 backend / admin / native_app / infra / docs 的全面调研整理，用于指导本仓库从"半成品业务示例"演进为"可直接复用的通用脚手架"。按优先级从高到低排列，同一优先级内按建议执行顺序排列。

---

## P0 — 阻塞性缺口（不做会拖累后续所有基于此模板的项目）

### 1. 补齐 CI/CD
- [ ] 新增 `.github/workflows/backend-ci.yml`：`./gradlew build test` + Checkstyle/Spotless（若引入）
- [ ] 新增 `.github/workflows/admin-ci.yml`：`pnpm install && pnpm lint && pnpm build`
- [ ] 新增 `.github/workflows/native-ci.yml`：`flutter analyze && flutter test`
- [ ] 三个 workflow 均限定 `paths` 触发，避免互相误触发

### 2. 补齐测试基础设施（哪怕只是示范样例）
- [ ] backend：为 `AuthServiceImpl` 或 `UserServiceImpl` 补 1-2 个 Service 单测 + 1 个 Controller 集成测试（作为团队后续写测试的范本）
- [ ] admin：引入 Vitest + React Testing Library，为 `services/request.ts` 拦截器逻辑和 1 个页面组件补测试
- [ ] native_app：新增 `test/` 目录，为 `login_view_model` 补 1 个 widget/unit test 作为范本
- [ ] 三端测试跑通后接入上面的 CI

### 3. 清理已入库的敏感信息与垃圾文件
- [ ] 根目录新增 `.gitignore`（覆盖 `.DS_Store`、`.idea/`、`*.iml` 等），并 `git rm --cached` 清理已跟踪的 `.DS_Store`、`native_app/.idea/*`
- [ ] 确认并清理疑似误操作产生的 `backend/backend/` 嵌套目录
- [ ] `infra/docker-compose.yml`、`application-dev.yaml` 中的明文密码改为从 `.env` 读取，新增根级 `.env.example` 说明必填变量
- [ ] admin / native_app 补 `.env.example`，避免真实 `.env.*` 文件内容（哪怕是非密钥的 base url）被直接提交作为"标准答案"

---

## P1 — 影响二次开发体验的半成品/误导性设计

### 4. 处理 admin 前端的"两套并行结构"
- [ ] 决策：保留扁平的 `pages/` + `services/api/` 结构，删除空壳 `features/`、`stores/`、`routes/`、`components/business`、`components/charts`；**或** 明确迁移到 `features/` 结构并给出迁移指南
- [ ] 二选一后在 `admin/README.md` 中写明目录约定，避免后来者困惑

### 5. 完善或移除按钮级权限体系
- [ ] `usePermissions`/`hasPermission` 已定义但零调用 —— 要么在关键按钮（如删除、编辑操作）接入示范用法，要么删除以免误导"权限已完备"
- [ ] 路由守卫 `beforeLoad` 目前只判断是否登录，补充基于菜单权限的路由级访问控制，与后端 RBAC 对齐

### 6. 清理 backend 空分层
- [ ] 评估 `common/security`、`common/annotation`、`auth/security`、`user/repository` 等 `.gitkeep` 占位目录：无具体规划的直接删除，有明确规划的在 README 中说明用途和落地时机
- [ ] MyBatis-Plus 项目中 `repository` 层与 `service`/`mapper` 职责重叠，建议去掉，除非有实际业务需要独立 Repository 抽象

### 7. 更新过时/占位 README
- [ ] `backend/README.md`：修正 API 示例（`/api/auth/*` → 实际的 `/api/app/auth/*` + `/api/admin/*`），同步请求体示例（phone 而非 username）
- [ ] `admin/README.md`：替换 Vite 默认模板文本，补充路由结构、请求封装约定、如何新增页面/菜单
- [ ] `native_app/README.md`：替换 `flutter create` 默认文本，补充 Feature-first 架构说明、状态管理约定、如何新增 feature

---

## P2 — 安全与工程规范

### 8. 登录接口防暴力破解
- [ ] 为密码登录（App 端 + 管理端）补充失败次数限制/账号锁定或图形验证码机制，参考已有的短信验证码 Redis 限流实现

### 9. 生产环境安全加固示例
- [ ] 补充 prod CORS 收紧配置示例（当前 dev 是 `allowed-origins: "*"`）
- [ ] 补充常见安全响应头配置（CSP / X-Frame-Options 等）示例

### 10. 统一代码规范工具
- [ ] backend 引入 Spotless 或 Checkstyle 并接入 CI
- [ ] 根目录补 `.editorconfig`
- [ ] 引入 husky + lint-staged（或 pre-commit）在提交前自动格式化/校验三端代码

### 11. 修复代码一致性问题
- [ ] `AuthServiceImpl.checkAuditStatus()` 中裸整数 `0`/`2` 判断改为使用已有的 `AuditStatus` 枚举，与 `resubmit()` 方法写法保持一致

---

## P3 — 完善度与长期可维护性

### 12. 数据库迁移工具化
- [ ] 引入 Flyway 或 Liquibase，将 `schema.sql`/`menu_migration.sql` 转为版本化迁移脚本

### 13. 应用容器化
- [ ] 为 backend 补 `Dockerfile`
- [ ] 为 admin 补 `Dockerfile`（多阶段构建 + nginx）
- [ ] 扩展 `infra/docker-compose.yml`，将应用本身纳入编排，实现真正的一键启动

### 14. 拆分膨胀中的类型文件
- [ ] `admin/src/types/api.ts` 按模块拆分（对齐 `services/api/` 的模块划分：`adminUser`/`appUser`/`auth`/`menu`/`role`）

### 15. native_app 收敛重复的 ViewModel 样板
- [ ] 抽取通用的 loading/error 状态处理（如封装一个通用 AsyncNotifier 基类或 mixin），减少 `login/register/reset_password/resubmit/account_review` 五个 ViewModel 中的重复 try/catch 逻辑

### 16. API 文档与代码对齐机制
- [ ] 评估将 Swagger 生成的 OpenAPI 导出为静态文件纳入仓库或 CI 产物，降低 `docs/{feature}/api.md` 人工维护与真实接口脱节的风险

### 17. 明确 docs/user-audit 的状态
- [ ] `user-audit` 功能三端均有未提交改动，处于半成品状态。决策：完成它作为模板的"复杂业务示范"，或移除相关代码只保留 `docs/user` 作为唯一示范场景

### 18. 可观测性增强（低优先级，视模板使用场景决定是否需要）
- [ ] Actuator 接入 Prometheus/Micrometer 指标
- [ ] TraceId 跨端透传方案（native_app/admin 请求头携带，后端日志串联）

### 19. 国际化（视模板目标市场决定是否需要）
- [ ] 评估是否需要为 backend（MessageSource）、admin（react-i18next）、native_app（intl）预留 i18n 骨架

---

## 执行建议

- P0 建议在下一次 sprint 内完成，是模板"可用性"的底线
- P1 建议在有实际二次开发者试用本模板前完成，否则半成品抽象会造成困惑甚至被误用
- P2/P3 可以分批迭代，其中 P2 的登录防暴力破解优先级略高于工程规范类事项
- 建议先决策 #17（`user-audit` 去留），因为这会影响 P0/P1 中多项测试和文档任务的范围
