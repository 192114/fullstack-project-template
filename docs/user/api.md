# 用户体系 - 接口约束文档

## 接口总览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/send-code | 发送短信验证码 | 否 |
| POST | /api/auth/login/password | 手机号 + 密码登录 | 否 |
| POST | /api/auth/login/sms | 手机号 + 验证码登录 | 否 |
| POST | /api/auth/register | 手机号注册 | 否 |
| POST | /api/auth/refresh | 刷新 Access Token | 否 |
| POST | /api/auth/logout | 退出登录 | 是 |
| GET | /api/auth/me | 获取当前用户信息 | 是 |
| POST | /api/auth/reset-password | 重置密码（免登录） | 否 |
| PUT | /api/users/profile | 修改个人资料 | 是 |
| PUT | /api/users/password | 修改密码 | 是 |

> **说明：** 现有的 `/api/auth/login`（用户名密码登录）将被上述新接口替代。现有 `/api/auth/register` 将被重构为手机号注册。现有用户管理 CRUD 接口（`/api/users` GET/POST/PUT/DELETE）保留，供管理端使用。

---

## 接口详情

### 1. 发送短信验证码

- **方法**: `POST`
- **路径**: `/api/auth/send-code`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位，1开头） |
| scene | Body | String | 是 | 场景：`LOGIN` / `REGISTER` / `RESET_PASSWORD` |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "scene": "LOGIN"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**失败响应:**
```json
{
  "code": 10014,
  "msg": "验证码发送过于频繁，请稍后再试",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10014 | 验证码发送过于频繁，请稍后再试 |
| 10015 | 无效的验证码场景 |

---

### 2. 手机号 + 密码登录

- **方法**: `POST`
- **路径**: `/api/auth/login/password`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| password | Body | String | 是 | 密码（6-64位） |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "password": "myPassword123"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "accessToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "refreshToken": "r1s2t3u4-v5w6-7890-abcd-ef1234567890",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "username": "user_13800138000",
      "nickname": "用户138****0000",
      "avatar": null,
      "email": null,
      "status": 1,
      "createTime": "2025-07-01 10:00:00",
      "updateTime": "2025-07-01 10:00:00"
    }
  }
}
```

**失败响应:**
```json
{
  "code": 10004,
  "msg": "手机号或密码错误",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10004 | 手机号或密码错误 |
| 10003 | 账号已被禁用 |

---

### 3. 手机号 + 验证码登录

- **方法**: `POST`
- **路径**: `/api/auth/login/sms`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| code | Body | String | 是 | 短信验证码（6位） |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "accessToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "refreshToken": "r1s2t3u4-v5w6-7890-abcd-ef1234567890",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "username": "user_13800138000",
      "nickname": "用户138****0000",
      "avatar": null,
      "email": null,
      "status": 1,
      "createTime": "2025-07-01 10:00:00",
      "updateTime": "2025-07-01 10:00:00"
    }
  }
}
```

**失败响应:**
```json
{
  "code": 10013,
  "msg": "验证码错误",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10010 | 手机号未注册 |
| 10012 | 验证码已过期，请重新获取 |
| 10013 | 验证码错误 |
| 10003 | 账号已被禁用 |

---

### 4. 手机号注册

- **方法**: `POST`
- **路径**: `/api/auth/register`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| password | Body | String | 是 | 密码（6-64位） |
| code | Body | String | 是 | 短信验证码（6位，场景 REGISTER） |
| nickname | Body | String | 否 | 昵称（最长64位），不传则自动生成 |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "password": "myPassword123",
  "code": "123456",
  "nickname": "张三"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "accessToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "refreshToken": "r1s2t3u4-v5w6-7890-abcd-ef1234567890",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "username": "user_13800138000",
      "nickname": "张三",
      "avatar": null,
      "email": null,
      "status": 1,
      "createTime": "2025-07-01 10:00:00",
      "updateTime": "2025-07-01 10:00:00"
    }
  }
}
```

**失败响应:**
```json
{
  "code": 10011,
  "msg": "手机号已注册",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10011 | 手机号已注册 |
| 10012 | 验证码已过期，请重新获取 |
| 10013 | 验证码错误 |

---

### 5. 刷新 Access Token

- **方法**: `POST`
- **路径**: `/api/auth/refresh`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| refreshToken | Body | String | 是 | 刷新令牌 |

**请求体示例:**
```json
{
  "refreshToken": "r1s2t3u4-v5w6-7890-abcd-ef1234567890"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "accessToken": "new-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "refreshToken": "new-r1s2t3u4-v5w6-7890-abcd-ef1234567890"
  }
}
```

> **说明：** Refresh Token 一次性使用，刷新后返回全新的 accessToken + refreshToken，旧 refreshToken 立即失效。

**失败响应:**
```json
{
  "code": 10016,
  "msg": "刷新令牌无效或已过期",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10016 | 刷新令牌无效或已过期 |

---

### 6. 退出登录

- **方法**: `POST`
- **路径**: `/api/auth/logout`
- **认证**: 是

**请求参数:** 无（需要 Authorization Header）

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

---

### 7. 获取当前用户信息

- **方法**: `GET`
- **路径**: `/api/auth/me`
- **认证**: 是

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "username": "user_13800138000",
    "nickname": "用户138****0000",
    "avatar": null,
    "email": null,
    "status": 1,
    "createTime": "2025-07-01 10:00:00",
    "updateTime": "2025-07-01 10:00:00"
  }
}
```

---

### 8. 重置密码（免登录）

- **方法**: `POST`
- **路径**: `/api/auth/reset-password`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| newPassword | Body | String | 是 | 新密码（6-64位） |
| code | Body | String | 是 | 短信验证码（6位，场景 RESET_PASSWORD） |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "newPassword": "newPassword456",
  "code": "123456"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10010 | 手机号未注册 |
| 10012 | 验证码已过期，请重新获取 |
| 10013 | 验证码错误 |

---

### 9. 修改个人资料

- **方法**: `PUT`
- **路径**: `/api/users/profile`
- **认证**: 是

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| nickname | Body | String | 否 | 昵称（最长64位） |
| email | Body | String | 否 | 邮箱（需符合邮箱格式） |
| avatar | Body | String | 否 | 头像 URL（最长255位） |

**请求体示例:**
```json
{
  "nickname": "新昵称",
  "email": "new@example.com",
  "avatar": "https://example.com/avatar.png"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "username": "user_13800138000",
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar.png",
    "email": "new@example.com",
    "status": 1,
    "createTime": "2025-07-01 10:00:00",
    "updateTime": "2025-07-01 11:00:00"
  }
}
```

---

### 10. 修改密码

- **方法**: `PUT`
- **路径**: `/api/users/password`
- **认证**: 是

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| oldPassword | Body | String | 是 | 原密码 |
| newPassword | Body | String | 是 | 新密码（6-64位） |

**请求体示例:**
```json
{
  "oldPassword": "myPassword123",
  "newPassword": "newPassword456"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10005 | 原密码不正确 |

---

## 错误码总览

| 错误码 | 描述 | 来源 |
|--------|------|------|
| 200 | 操作成功 | ResultCode.SUCCESS |
| 400 | 请求参数错误 | ResultCode.BAD_REQUEST |
| 401 | 未登录或登录已过期 | ResultCode.UNAUTHORIZED |
| 403 | 无访问权限 | ResultCode.FORBIDDEN |
| 500 | 服务器内部错误 | ResultCode.INTERNAL_ERROR |
| 10001 | 用户名已存在 | UserResultCode |
| 10002 | 用户不存在 | UserResultCode |
| 10003 | 账号已被禁用 | UserResultCode |
| 10004 | 手机号或密码错误 | UserResultCode |
| 10005 | 原密码不正确 | UserResultCode |
| 10010 | 手机号未注册 | AuthResultCode |
| 10011 | 手机号已注册 | AuthResultCode |
| 10012 | 验证码已过期，请重新获取 | AuthResultCode |
| 10013 | 验证码错误 | AuthResultCode |
| 10014 | 验证码发送过于频繁，请稍后再试 | AuthResultCode |
| 10015 | 无效的验证码场景 | AuthResultCode |
| 10016 | 刷新令牌无效或已过期 | AuthResultCode |
