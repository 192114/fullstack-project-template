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
│   └── menu/                # 菜单管理
│
└── BackendApplication.java  # 启动类
```

> 新增模块前先想清楚要放什么再建目录，不需要预先建空的 `security/`、`repository/`、`annotation/` 占位包。

## 快速启动

### 1. 准备环境

- JDK 21+
- MySQL 8.x
- Redis 6.x+

### 2. 初始化数据库

```bash
mysql -u root -p < src/main/resources/sql/schema.sql
```

后续表结构变更以 `sql/` 目录下按用途命名的增量 SQL 文件追加维护（如 `menu_migration.sql`），手动执行并在 PR 里说明，不引入 Flyway/Liquibase 等迁移框架。

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

## 统一返回结构

所有 API 返回格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

HTTP 状态码与 `code` 字段保持一致（如 404 请求返回 HTTP 404 + `code: 404`）。

## 日志格式

```
2026-06-10 15:30:00.123 [http-nio-8080-exec-1] [a1b2c3d4e5f6] INFO  c.s.b.aspect.RequestLogAspect - 请求完成 | method=POST | uri=/api/app/auth/login/password | ip=127.0.0.1 | cost=42ms
```

- 链路追踪 ID 通过 `X-Trace-Id` 请求头传递，未传递时自动生成
- 响应头中也会返回 `X-Trace-Id`

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

### App 端认证（需登录，Header 携带 `Authorization: <token>`）

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
  -d '{"username":"admin","password":"123456"}'
```

密码登录连续失败 5 次会锁定 15 分钟（`LoginAttemptGuard`，基于 Redis 计数），App 端与管理端分别计数。

### 带 Token 请求示例

```bash
curl http://localhost:8080/api/app/auth/me \
  -H "Authorization: <your-token>"
```

## 新增业务模块

1. 在 `com.shadow.backend` 下创建模块目录（如 `course/`）
2. 按标准结构创建子目录：`controller/`、`service/`、`mapper/`、`entity/`、`dto/`、`vo/`
3. 在 `SaTokenConfigure` 中按需调整路由白名单
