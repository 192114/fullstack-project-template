# API 响应结构规范

## 统一响应格式

后端所有 API 返回统一的 `{code, msg, data}` 结构：

```typescript
interface ApiResponse<T = unknown> {
  code: number    // 业务状态码，200 表示成功
  msg: string     // 提示信息
  data: T         // 业务数据
}
```

## 分页响应

```typescript
interface PageResult<T = unknown> {
  records: T[]    // 数据列表
  total: number   // 总记录数
  size: number    // 每页条数
  current: number // 当前页码
}
```

## 错误码规范

| 错误码 | 含义 | 前端处理 |
|--------|------|---------|
| 200 | 成功 | 正常处理 data |
| 400 | 请求参数错误 | Toast 提示 msg |
| 401 | 未登录/Token 过期 | 清除 Token，跳转登录页 |
| 403 | 无权限 | Toast 提示无权限 |
| 500 | 服务器错误 | Toast 提示稍后重试 |

## 前端处理规范

1. 使用 `src/services/request.ts` 中的 Axios 拦截器统一处理响应
2. 使用 `requestApi()` 辅助函数自动提取 `data` 字段
3. 不要在业务代码中直接判断 `code !== 200`
4. API 函数统一放在 `src/services/api/` 目录下，按模块划分
5. 所有 API 函数的参数和返回值必须有明确的 TypeScript 类型定义
