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

采用 **Feature-based（按业务模块划分）** 的目录结构：

```
src/main/java/com/shadow/backend/
├── common/                  # 公共模块
│   ├── aspect/              # AOP 切面（请求日志）
│   ├── config/              # 全局配置（CORS、MyBatis-Plus、Sa-Token）
│   ├── constant/            # 常量定义
│   ├── exception/           # 业务异常 + 全局异常处理
│   ├── filter/              # 过滤器（TraceId 链路追踪）
│   ├── response/            # 统一返回结构 Result<T>
│   ├── util/                # 工具类（Argon2 密码加密）
│   ├── security/            # 安全相关扩展（预留）
│   └── annotation/          # 自定义注解（预留）
│
├── user/                    # 用户模块（CRUD 示例）
│   ├── controller/          # REST 接口
│   ├── service/             # 业务逻辑
│   ├── mapper/              # MyBatis Mapper
│   ├── entity/              # 数据库实体
│   ├── dto/                 # 请求参数
│   ├── vo/                  # 响应视图
│   └── repository/          # 仓储层（预留）
│
├── auth/                    # 登录认证模块
│   ├── controller/          # 登录/登出/注册
│   ├── service/             # 认证业务
│   ├── dto/                 # 登录请求/响应
│   └── security/            # 认证扩展（预留）
│
└── BackendApplication.java  # 启动类
```

## 快速启动

### 1. 准备环境

- JDK 21+
- MySQL 8.x
- Redis 6.x+

### 2. 初始化数据库

```bash
mysql -u root -p < src/main/resources/sql/schema.sql
```

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
2026-06-10 15:30:00.123 [http-nio-8080-exec-1] [a1b2c3d4e5f6] INFO  c.s.b.aspect.RequestLogAspect - 请求完成 | method=POST | uri=/api/auth/login | ip=127.0.0.1 | cost=42ms
```

- 链路追踪 ID 通过 `X-Trace-Id` 请求头传递，未传递时自动生成
- 响应头中也会返回 `X-Trace-Id`

## API 示例

### 认证（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |

### 用户管理（需登录）

请求头携带 Token：`Authorization: <token>`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users?page=1&size=10` | 分页查询 |
| GET | `/api/users/{id}` | 查询详情 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/{id}` | 更新用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

### 登录示例

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 带 Token 请求示例

```bash
curl http://localhost:8080/api/users \
  -H "Authorization: <your-token>"
```

## 新增业务模块

1. 在 `com.shadow.backend` 下创建模块目录（如 `course/`）
2. 按标准结构创建子目录：`controller/`、`service/`、`mapper/`、`entity/`、`dto/`、`vo/`
3. 在 `SaTokenConfigure` 中按需调整路由白名单
