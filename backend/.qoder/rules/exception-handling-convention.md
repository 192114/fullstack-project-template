---
description: 业务异常使用 BusinessException + IResultCode
globs:
  - "**/service/**/*.java"
  - "**/controller/*.java"
---

# 异常处理规范

业务异常统一通过 `BusinessException` 抛出，由 `GlobalExceptionHandler` 集中处理，禁止在业务代码中自行 catch 或返回错误信息。

## 规则

1. **抛出业务异常**：使用 `throw new BusinessException(IResultCode)` 或 `throw new BusinessException(int code, String msg)`
2. **定义错误码**：模块级错误码实现 `IResultCode` 接口，放在模块的 `response/` 目录下
3. **禁止**在 Service 中 catch 异常后吞掉或转换为返回值
4. **禁止**在 Controller 中 try-catch 处理业务异常，统一由全局异常处理器处理
5. 公共错误码使用 `ResultCode` 枚举（如 `ResultCode.BAD_REQUEST`、`ResultCode.UNAUTHORIZED`）

## 示例

```java
// 定义模块错误码
public enum UserResultCode implements IResultCode {
    USER_NOT_FOUND(1001, "用户不存在"),
    USERNAME_EXIST(1002, "用户名已存在");

    private final int code;
    private final String msg;
}

// Service 中抛出异常
if (user == null) {
    throw new BusinessException(UserResultCode.USER_NOT_FOUND);
}
```
