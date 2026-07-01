# 项目结构规范

## 技术栈

- Spring Boot 4.1.0 + Java 21
- ORM: MyBatis-Plus 3.5.16
- 认证: Sa-Token 1.45.0 + Redis
- 密码: Argon2 (de.mkammerer:argon2-jvm)
- 文档: SpringDoc OpenAPI 3.0.2
- 日志: Logback + TraceId MDC

## 目录结构

采用 Feature-based 模块化结构，按业务域组织代码：

```
com.shadow.backend/
├── common/                 # 公共模块（所有 feature 共享）
│   ├── annotation/         # 自定义注解
│   ├── aspect/             # AOP 切面
│   ├── config/             # 全局配置类
│   ├── constant/           # 全局常量
│   ├── exception/          # 异常 & 全局异常处理器
│   ├── filter/             # Servlet Filter
│   ├── response/           # 统一响应体 (Result, PageResult, IResultCode, ResultCode)
│   ├── security/           # 安全相关
│   └── util/               # 工具类
├── {feature}/              # 业务模块（如 user, auth, order）
│   ├── controller/         # REST 控制器
│   ├── dto/                # 请求 DTO（如 CreateUserRequest, UserPageQuery）
│   ├── entity/             # MyBatis-Plus 实体
│   ├── mapper/             # MyBatis-Plus Mapper 接口
│   ├── repository/         # 复杂查询仓储（可选）
│   ├── response/           # 模块错误码 enum（实现 IResultCode）
│   ├── service/            # Service 接口
│   │   └── impl/           # Service 实现
│   └── vo/                 # 视图对象（如 UserVO）
└── BackendApplication.java # 启动类
```

## 配置管理

- 公共配置: `application.yaml`
- 环境配置: `application-dev.yaml` / `application-prod.yaml`
- 日志配置: `logback-spring.xml`
- SQL: `resources/sql/schema.sql`

## 新增 CRUD 模块 Checklist

1. 创建 `entity` + `mapper` + `dto` + `vo`
2. 创建 `service` 接口 + `impl`（包含 toVO 转换方法）
3. 创建 `controller`（统一 Result 包装）
4. 在模块 `response/` 下创建错误码 enum（实现 `IResultCode`）
5. 在 `schema.sql` 中添加建表语句
6. 按需调整 `SaTokenConfigure` 白名单

## 错误码编号规则

- 通用错误码: `ResultCode` 枚举（200, 400, 401, 403, 404, 409, 500）
- 用户模块: `1xxxx`（10001 ~ 19999）
- 课程模块: `2xxxx`（20001 ~ 29999）
- 后续模块递增: `{模块序号}xxxx`
