# 编码规范

## 依赖注入

- 使用构造器注入，配合 `@RequiredArgsConstructor`（Lombok）
- 依赖字段声明为 `private final`
- 禁止使用 `@Autowired` 字段注入

```java
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;
    private final PasswordUtil passwordUtil;
}
```

## Lombok 使用

| 场景 | 注解 |
|------|------|
| DTO / VO / Entity | `@Data` |
| 枚举（含字段） | `@Getter` + `@AllArgsConstructor` |
| Service 实现 / Controller | `@RequiredArgsConstructor` |
| 异常类（需要 getter） | `@Getter` |
| 日志 | `@Slf4j` |
| 无参 + 全参构造 | `@NoArgsConstructor` + `@AllArgsConstructor`（Result 类） |

## Entity 规范

- 使用 MyBatis-Plus `@TableName` 指定表名
- 主键用 `@TableId(type = IdType.AUTO)` 或 `ASSIGN_ID`
- 自动填充字段（createTime, updateTime）由 `MyBatisMetaObjectHandler` 处理
- Entity 仅用于数据层，禁止直接暴露给 Controller

## DTO / VO 规范

| 类型 | 命名 | 用途 |
|------|------|------|
| 创建请求 | `Create{Entity}Request` | `@Valid @RequestBody` |
| 更新请求 | `Update{Entity}Request` | `@Valid @RequestBody` |
| 分页查询 | `{Entity}PageQuery` | 查询参数绑定（不加 @RequestBody） |
| 返回视图 | `{Entity}VO` | Controller 响应数据 |

- DTO 和 VO 上必须添加 JSR 380 校验注解（`@NotBlank`, `@NotNull`, `@Size` 等）
- 校验消息使用中文: `@NotBlank(message = "用户名不能为空")`

## Service 层

- Service 接口定义在 `{feature}/service/` 下
- Service 实现放在 `{feature}/service/impl/` 下
- 业务逻辑全部放在 Service 层，Controller 只做参数接收和结果返回
- Entity → VO 的转换在 Service 层完成
- 使用 `@Transactional` 管理写操作事务

## Mapper 层

- 继承 `BaseMapper<Entity>`
- 简单 CRUD 用 MyBatis-Plus 内置方法
- 复杂查询可用 `@Select` 注解或 XML 映射

## 日志规范

- 使用 `@Slf4j`（Lombok）
- 参数化日志: `log.info("用户登录: username={}", username)`
- 禁止字符串拼接: ~~`log.info("用户登录: " + username)`~~
- 异常日志: `log.error("xxx失败", ex)`

## 认证

- Sa-Token: `StpUtil.login(userId)` / `StpUtil.checkLogin()`
- 获取当前用户: `LoginUserUtil.currentUserId()`
- 请求头: `Authorization`（由 `SaTokenConfigure` 拦截器处理）
- 密码加密: 使用 `PasswordUtil`（Argon2 算法）

## 空安全

- Spring 7 / Spring Boot 4 使用 `@NullMarked` 包级注解
- 重写父类方法时，参数需显式添加 `@NonNull`（`org.jspecify.annotations.NonNull`）
- 避免返回 null，优先使用 `Optional` 或抛出 `BusinessException`
