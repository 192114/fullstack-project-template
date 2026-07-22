---
description: 测试编写规范（分级要求，非全面禁止）
globs:
  - "**/*.java"
---

# 测试编写规范

项目**要求**为核心业务逻辑编写单元测试，但不要求覆盖所有代码。按以下分级执行：

## 必须写测试

Service 实现类里包含实际业务分支、状态流转、校验规则的方法，例如：

- 登录/注册/审核状态流转（如 `AuthServiceImpl`、`AdminAuthServiceImpl`）
- Token 生成/刷新/失效逻辑（如 `TokenServiceImpl`）
- 验证码发送频率限制、校验与核销（如 `SmsServiceImpl`）
- 密码修改、用户状态变更等带校验分支的方法（如 `UserServiceImpl`）
- 登录失败次数限制等公共工具类（如 `LoginAttemptGuard`）

## 强烈建议写测试

- 权限提供者的角色/权限分支逻辑（如 `StpInterfaceImpl` 按 `loginType` 返回不同结果）
- `@Transactional` 方法里的业务规则分支（如"不能删除/禁用当前登录账号"、"角色被占用时禁止删除"）
- 纯逻辑的公共工具类（如 `PasswordUtil` 的 hash/verify）

## 不需要写测试

- Controller 层（薄封装，直接委托 Service，无独立逻辑）
- Mapper/SQL 层（MyBatis-Plus 生成方法、简单 CRUD）
- 全量 Spring 上下文的 `@SpringBootTest` 集成测试（需要真实 MySQL/Redis，CI 环境不提供，不要写）

## 写法要求

- 用 JUnit 5 + Mockito，**不要**用 `@SpringBootTest` 启动完整上下文——用 `@ExtendWith(MockitoExtension.class)` + `@Mock`/`@InjectMocks` 隔离测试，不依赖真实数据库/Redis
- 测试类与被测类同包路径，放在 `src/test/java/...`，命名为 `{ClassName}Test`
- 一个方法测多个分支（成功路径 + 每个异常/边界分支），不要为了"有测试"而只测 happy path

## 参考技能包的取舍

`backend/.qoder/skills/java-springboot` 是通用参考技能包，其中关于测试的建议**只采纳单元测试（JUnit5 + Mockito mock 依赖）部分**；其建议的 `@SpringBootTest` 集成测试、Testcontainers 均超出本项目范围，**不要采纳**。该技能包提到的 JPA、BCrypt 等技术选型建议同样不适用（项目实际使用 MyBatis-Plus + Argon2），仅供参考不代表项目约定。
