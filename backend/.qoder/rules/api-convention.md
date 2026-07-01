# API 返回结果规范

## 统一响应体 Result<T>

所有 API 响应必须使用 `Result<T>` 包装，禁止直接返回实体或 Map。

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private int code;       // 业务状态码（对应 HTTP status 或自定义错误码）
    private String msg;     // 提示信息
    private T data;         // 响应数据（失败时为 null）
}
```

### 使用方式

| 场景 | 调用方式 |
|------|----------|
| 成功无数据 | `Result.success()` |
| 成功有数据 | `Result.success(data)` |
| 失败（按错误码枚举） | `Result.fail(resultCode)` |
| 失败（自定义 code + msg） | `Result.fail(code, msg)` |
| 失败（枚举 + 覆盖 msg） | `Result.fail(resultCode, msg)` |

## 分页响应 PageResult<T>

分页查询统一使用 `Result<PageResult<T>>` 包装：

```java
@Data
public class PageResult<T> {
    private long current;     // 当前页码
    private long size;        // 每页条数
    private long total;       // 总记录数
    private long pages;       // 总页数
    private List<T> records;  // 数据列表
}
```

- 从 MyBatis-Plus Page 转换: `PageResult.of(page)`
- 手动构建: `PageResult.of(current, size, total, records)`

## 错误码接口 IResultCode

```java
public interface IResultCode {
    int getCode();
    String getMsg();
}
```

- 通用错误码: `ResultCode` 枚举（SUCCESS=200, BAD_REQUEST=400, UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404, CONFLICT=409, INTERNAL_ERROR=500）
- 业务错误码: 各模块 `{Feature}ResultCode` 枚举，code 按模块编号段分配

## Controller 层规范

### 返回值

| 操作 | 返回类型 |
|------|----------|
| 查询单条 | `Result<UserVO>` |
| 分页查询 | `Result<PageResult<UserVO>>` |
| 新增/修改 | `Result<UserVO>` |
| 删除 | `Result<Void>` |

### 注解使用

- `@RestController` + `@RequestMapping("/api/{feature}")`
- `@RequiredArgsConstructor` 构造器注入
- 请求体: `@Valid @RequestBody XxxRequest`
- 查询参数: `@Valid XxxPageQuery`（不加 @RequestBody）
- 路径参数: `@PathVariable Long id`

### 示例

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public Result<PageResult<UserVO>> page(@Valid UserPageQuery query) {
        return Result.success(userService.page(query));
    }

    @PostMapping
    public Result<UserVO> create(@Valid @RequestBody CreateUserRequest request) {
        return Result.success(userService.create(request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return Result.success();
    }
}
```

## 异常处理

- 业务异常: 抛出 `BusinessException(resultCode)` 或 `BusinessException(resultCode, "自定义消息")`
- 全局处理: `GlobalExceptionHandler` 自动捕获并转为 `Result<Void>` 响应
- HTTP Status 与 code 的映射由 `GlobalExceptionHandler.resolveBusinessHttpStatus()` 决定
