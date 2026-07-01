---
description: API 响应统一使用 Result 包装
globs:
  - "**/controller/*.java"
---

# API 响应规范

所有 Controller 接口的返回值必须使用统一响应包装，禁止直接返回裸对象或自定义格式。

## 规则

1. **普通响应**：使用 `Result<T>` 包装，通过 `Result.success()` 或 `Result.success(data)` 返回
2. **分页响应**：使用 `Result<PageResult<T>>` 包装，通过 `PageResult.of(page)` 构建
3. **失败响应**：使用 `Result.fail(resultCode)` 或 `Result.fail(code, msg)` 返回
4. **禁止**在 Controller 中直接返回 `ResponseEntity`、`Map`、`String` 等非标准类型（文件下载等特殊场景除外）

## 示例

```java
// 正确
@GetMapping("/{id}")
public Result<UserVO> getById(@PathVariable Long id) {
    return Result.success(userService.getById(id));
}

// 错误 - 未使用 Result 包装
@GetMapping("/{id}")
public UserVO getById(@PathVariable Long id) {
    return userService.getById(id);
}
```
