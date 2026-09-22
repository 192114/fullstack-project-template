# Backend 模板项目

基于 **Spring Boot 4.1.0 + Java 21** 的后端开发模板，集成 MyBatis-Plus、Sa-Token、Argon2 密码加密、链路追踪日志与统一异常处理。

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 4.1.0 | Web 框架 |
| MyBatis-Plus | 3.5.16 | ORM + 分页 |
| Sa-Token | 1.45.0 | 认证鉴权 |
| Argon2 JVM | 2.12 | 密码加密 |
| Redis | - | Sa-Token 会话存储 |
| MySQL | - | 数据持久化 |

## 项目结构

采用 **Feature-based（按业务模块划分）** 的目录结构。项目是 **App 端 / 管理端双账户体系**：App 端接口挂在 `/api/app/**`（`StpAppUtil` 校验），管理端接口挂在 `/api/admin/**`（`StpAdminUtil` 校验），两套会话完全隔离。

```
src/main/java/com/shadow/backend/
├── common/                  # 公共模块
│   ├── aspect/              # AOP 切面（请求日志）
│   ├── config/              # 全局配置（CORS、MyBatis-Plus、Sa-Token）
│   ├── constant/            # 常量定义
│   ├── exception/           # 业务异常 + 全局异常处理
│   ├── filter/              # 过滤器（TraceId 链路追踪）
│   ├── response/            # 统一返回结构 Result<T>
│   └── util/                # 工具类（Argon2 密码加密、登录失败次数限制等）
│
├── user/                    # App 用户模块（注册用户、审核状态）
│   ├── controller/          # REST 接口
│   ├── service/             # 业务逻辑
│   ├── mapper/              # MyBatis Mapper
│   ├── entity/              # 数据库实体
│   ├── dto/                 # 请求参数
│   ├── vo/                  # 响应视图
│   └── constant/            # 枚举/常量（如 AuditStatus）
│
├── auth/                    # App 端登录认证模块（/api/app/auth/**）
│   ├── controller/          # 登录/注册/审核状态/重新提交
│   ├── service/             # 认证业务
│   ├── dto/                 # 登录请求/响应
│   └── vo/                  # 响应视图
│
├── admin/                   # 管理端模块（/api/admin/**）
│   ├── auth/                # 管理员登录
│   ├── user/                # App 用户管理 + 注册审核
│   ├── adminuser/           # 管理员账号管理
│   ├── role/                # 角色管理
│   ├── menu/                # 菜单管理
│   └── audit/               # 管理操作审计
│
└── BackendApplication.java  # 启动类
```

> 新增模块前先想清楚要放什么再建目录，不需要预先建空的 `security/`、`repository/`、`annotation/` 占位包。

## 快速启动

### 1. 准备环境

- JDK 21+
- MySQL 8.x
- Redis 6.2+（Refresh Token 原子核销使用 `GETDEL`）

### 2. 初始化数据库

```bash
mysql -u root -p < src/main/resources/sql/schema.sql
```

后续表结构变更以 `sql/` 目录下按用途命名的增量 SQL 文件追加维护，手动执行并在 PR 里说明，不引入 Flyway/Liquibase 等迁移框架。

已有环境升级前备份数据库，并在目标库执行所需脚本：

```bash
mysql -u root -p backend < src/main/resources/sql/operation_log_migration.sql
mysql -u root -p backend < src/main/resources/sql/menu_migration.sql
```

- `operation_log_migration.sql`：幂等创建管理操作审计表。
- `menu_migration.sql`：单实例执行，只补缺失菜单和启用超管的菜单关联，保留已有名称、路由、状态、ID 及普通角色授权；不恢复逻辑删除项。
- 账号手机号、用户名、角色编码在逻辑删除后仍占用唯一键，不允许复用；冲突返回 HTTP 200 + `code:409`。

### 3. 修改配置

编辑 `src/main/resources/application-dev.yaml`，配置数据库和 Redis 连接信息。

### 4. 启动项目

```bash
./gradlew bootRun
```

默认端口：`8080`，默认环境：`dev`

## 环境配置

| 环境 | Profile | 日志策略 |
|------|---------|----------|
| 开发 | `dev` | 控制台彩色输出 |
| 生产 | `prod` | 按天滚动文件，保留 30 天 |

切换环境：

```bash
# 开发（默认）
./gradlew bootRun

# 生产
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

生产环境日志路径可通过环境变量 `LOG_PATH` 配置，默认为 `logs/`。

prod 启动必须提供以下非空配置，缺失时启动失败：

| 环境变量 | 用途 |
|----------|------|
| `DB_PASSWORD` | MySQL 口令 |
| `REDIS_PASSWORD` | Redis 口令 |
| `ADMIN_INITIAL_PASSWORD` | 首次创建 `admin` 的口令；不会覆盖已有账号密码 |
| `CORS_ALLOWED_ORIGINS` | 允许跨域的前端来源列表，使用逗号分隔，生产请配置明确来源 |

开发环境首次创建的管理员是 `admin`，默认密码 `admin123`，仅供本地开发；任何环境均不在日志输出初始密码。prod 默认关闭 OpenAPI 文档和 Swagger UI。

`app.security.trusted-proxy` 默认为 `false`（可通过 `APP_SECURITY_TRUSTED_PROXY` 配置）。只有在入口代理覆盖转发头、且后端不能被客户端绕过代理直连时才启用，否则客户端可伪造来源 IP。

## 统一返回结构

所有 API 返回格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

HTTP 状态码与业务 `code` 不总是一致，客户端必须同时处理：

| 场景 | HTTP 状态码 | `code` |
|------|-------------|--------|
| 成功 | 200 | 200 |
| 业务异常 | 200 | 对应业务错误码（如 10019） |
| 唯一键/数据完整性冲突 | 200 | 409 |
| 参数校验失败 | 400 | 400 |
| 未登录/无权限 | 401/403 | 401/403 |
| 路径不存在/服务异常 | 404/500 | 404/500 |

分页使用 `Result<PageResult<T>>`；管理员、角色及 App 用户分页均要求 `current >= 1`、`1 <= size <= 100`。

## 日志格式

```
2026-06-10 15:30:00.123 [http-nio-8080-exec-1] [a1b2c3d4e5f6] INFO  c.s.b.aspect.RequestLogAspect - 请求完成 | method=POST | uri=/api/app/auth/login/password | ip=127.0.0.1 | cost=42ms
```

- `X-Trace-Id` 仅接受 1～32 位字母、数字、下划线或连字符；缺失或不合法时重新生成，响应头回传实际值。
- 手机号日志统一脱敏，不记录明文验证码或密码。
- 默认使用连接来源 IP；仅在可信代理开关启用时使用 `X-Forwarded-For` 首项或 `X-Real-IP`。

### 管理操作审计

已登录管理员进入 Controller 的 POST/PUT/DELETE 操作同步写入 `sys_operation_log`，记录管理员、方法、URI、脱敏参数、结果码、来源 IP、耗时和 TraceId；登录、匿名请求和读操作不记录。身份在业务执行前获取，退出登录仍可记录原操作者。

参数递归屏蔽密码、验证码、Token 等敏感字段，手机号脱敏，参数内容最长 1024 字符（截断后可能不是完整 JSON）；不记录请求头与响应内容。审计准备或落库失败只告警，不改变业务结果；在拦截器或参数绑定阶段被拒绝的请求不会进入该审计切面，此机制不等同于防篡改审计存储。

## API 示例

### App 端认证 `/api/app/auth`（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/app/auth/send-code` | 发送短信验证码 |
| POST | `/api/app/auth/register` | 手机号 + 验证码注册（默认进入待审核状态） |
| POST | `/api/app/auth/login/password` | 手机号密码登录 |
| POST | `/api/app/auth/login/sms` | 手机号验证码登录 |
| GET | `/api/app/auth/audit-status?phone=` | 查询注册审核状态 |
| POST | `/api/app/auth/resubmit` | 审核被拒后重新提交 |
| POST | `/api/app/auth/reset-password` | 重置密码 |
| POST | `/api/app/auth/refresh` | 刷新 Token |

### App 端认证（需登录，Header 携带 `Authorization: Bearer <token>`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/app/auth/me` | 获取当前用户信息 |
| POST | `/api/app/auth/logout` | 登出 |

### 管理端（`/api/admin/**`，需管理员登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/auth/login` | 管理员登录（用户名+密码） |
| GET/POST/PUT/DELETE | `/api/admin/users/**` | App 用户管理（含注册审核 `POST /api/admin/users/{id}/audit`） |
| GET/POST/PUT/DELETE | `/api/admin/admin-users/**` | 管理员账号管理 |
| GET/POST/PUT/DELETE | `/api/admin/roles/**` | 角色管理 |
| GET/POST/PUT/DELETE | `/api/admin/menus/**` | 菜单管理 |

### 登录示例

```bash
# App 端：手机号 + 密码登录
curl -X POST http://localhost:8080/api/app/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'

# 管理端：用户名 + 密码登录
curl -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

密码登录连续失败 5 次会锁定 15 分钟（`LoginAttemptGuard`，基于 Redis 计数），App 端与管理端分别计数。

### 权限与认证约束

- 管理端先检查登录，再按路由和 HTTP 方法检查 `menu:*`、`role:*`、`admin-user:*` 等权限；无权限返回 HTTP 403。自身认证信息和 `/api/admin/menus/tree` 仅要求登录。
- App 用户管理的创建、修改、删除暂归 `user:list`，审核需要 `user:audit`；完整映射见 [接口约束](../docs/backend-optimization/api.md)。新增管理端接口需同步增加映射，未匹配的路径目前仅检查登录。
- 分配角色先去重并校验启用状态；普通管理员只能分配自身持有的角色，`support` 超管豁免该子集限制。禁止修改自己的角色；账号状态/角色变更先锁定同一 support 角色行，禁用、删除或移除最后一名启用超管会被拒绝。
- 停用或逻辑删除的角色不参与菜单和权限查询。审核仅接受通过/拒绝，并以待审核状态作为更新条件，重复审核返回 10019。
- Refresh Token 有效期 7 天，通过原子 `GETDEL` 核销后轮换；刷新前复核账号状态。退出只撤销当前设备；重置密码、禁用或删除用户会触发全账号会话撤销。

### 当前边界

- `role:assign` 目前校验菜单存在性，但不限制所授菜单权限必须属于操作者自身；请仅授予可信的权限管理员，细化权限委派规则需另行规划。
- 菜单种子初始化支持中断后重跑，但菜单业务标识无唯一约束，多实例并发首次初始化仍可能产生重复菜单；首次初始化与菜单迁移应串行执行。
- 审核查询仍是匿名接口，字段脱敏与按手机号限流并不等同于防批量枚举；本轮未增加验证码凭证或网关级限流。

### 短信与审核查询

- 同一手机号发送冷却 60 秒，每日默认最多 10 次（`app.sms.daily-limit`），按服务端时区次日零点重置。
- 验证码有效期 5 分钟，同场景累计输错 5 次即作废；成功核销与失败计数均通过 Redis Lua 原子执行。
- `app_sms_log.code` 只写固定掩码。dev 仅模拟发送事件，不实际发送、也不在日志展示验证码；短信联调需接入真实或测试供应商。prod 未接入供应商时返回业务码 10025。
- 匿名审核查询同一手机号每 60 秒最多一次，仅返回 `auditStatus` 和脱敏 `phone`，不返回审核备注、昵称及创建时间；前端需按此字段契约适配。

### 带 Token 请求示例

```bash
curl http://localhost:8080/api/app/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## 本地验证与 CI

```bash
./gradlew build
```

构建包含编译、JUnit 5 + Mockito 单元测试、Checkstyle 生产代码及测试代码检查，不启动 Spring 或依赖真实 MySQL/Redis。Checkstyle 仅校验命名、未使用/冗余导入，不要求格式重排；测试方法允许下划线。

`.github/dependabot.yml` 配置 Gradle 和 GitHub Actions 的每周依赖更新检查；漏洞告警与安全更新还需在 GitHub 仓库设置中启用对应功能，本地配置不等同于漏洞扫描结果。

## 新增业务模块

1. 在 `com.shadow.backend` 下创建模块目录（如 `course/`）
2. 按标准结构创建子目录：`controller/`、`service/`、`mapper/`、`entity/`、`dto/`、`vo/`
3. 在 `SaTokenConfigure` 中按需调整路由白名单
