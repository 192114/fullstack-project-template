# 用户注册审核 - 接口约束文档

## 接口总览

### App 端接口（修改现有 + 新增）

| 方法 | 路径 | 描述 | 认证 | 变更类型 |
|------|------|------|------|----------|
| POST | /api/app/auth/register | 手机号注册 | 否 | **修改**（不再返回 Token，返回 RegisterResponse） |
| POST | /api/app/auth/login/password | 手机号 + 密码登录 | 否 | **修改**（新增审核校验） |
| POST | /api/app/auth/login/sms | 手机号 + 验证码登录 | 否 | **修改**（新增审核校验） |
| GET | /api/app/auth/audit-status | 查询审核状态 | 否 | **新增** |
| POST | /api/app/auth/resubmit | 驳回后重新提交审核 | 否 | **新增** |

### 管理端接口（修改现有 + 新增）

| 方法 | 路径 | 描述 | 认证 | 变更类型 |
|------|------|------|------|----------|
| GET | /api/admin/users | 分页查询 App 用户 | 是 | **修改**（新增 auditStatus 筛选） |
| POST | /api/admin/users/{id}/audit | 审核用户 | 是 | **新增** |

---

## 接口详情

### 1. 手机号注册（修改现有）

- **方法**: `POST`
- **路径**: `/api/app/auth/register`
- **认证**: 否

**请求参数:** （无变更）

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

**成功响应（变更）：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "user": {
      "id": 1,
      "phone": "13800138000",
      "username": null,
      "nickname": "张三",
      "avatar": null,
      "email": null,
      "status": 1,
      "auditStatus": 0,
      "auditRemark": null,
      "auditTime": null,
      "createTime": "2025-07-06 10:00:00",
      "updateTime": "2025-07-06 10:00:00"
    }
  }
}
```

> **关键变更：** 注册成功后不再返回 `accessToken` 和 `refreshToken`，仅返回用户信息（含 `auditStatus: 0` 表示待审核）。App 端收到响应后跳转审核状态页。

**失败响应:**
```json
{
  "code": 10011,
  "msg": "手机号已注册",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 | 变更 |
|--------|------|------|
| 10011 | 手机号已注册 | 保持 |
| 10012 | 验证码已过期，请重新获取 | 保持 |
| 10013 | 验证码错误 | 保持 |

---

### 2. 手机号 + 密码登录（修改现有）

- **方法**: `POST`
- **路径**: `/api/app/auth/login/password`
- **认证**: 否

**请求参数:** （无变更）

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| password | Body | String | 是 | 密码（6-64位） |

**成功响应:** （无变更，返回 LoginResponse 含 accessToken、refreshToken、user）

**新增失败响应:**
```json
{
  "code": 10017,
  "msg": "账号审核中，请耐心等待管理员审核",
  "data": null
}
```

```json
{
  "code": 10018,
  "msg": "注册审核未通过：提交的资料不完整，请补充后重新注册",
  "data": null
}
```

> **变更说明：** 登录时先校验审核状态，auditStatus=0 返回 10017，auditStatus=2 返回 10018（msg 中拼接驳回原因）。UserVO 新增 `auditStatus`、`auditRemark`、`auditTime` 字段。

---

### 3. 手机号 + 验证码登录（修改现有）

- **方法**: `POST`
- **路径**: `/api/app/auth/login/sms`
- **认证**: 否

**请求参数:** （无变更）

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| code | Body | String | 是 | 短信验证码（6位） |

**成功响应:** （无变更）

**新增失败响应:** 同密码登录，支持 10017、10018 错误码。

---

### 4. 查询审核状态（新增）

- **方法**: `GET`
- **路径**: `/api/app/auth/audit-status`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Query | String | 是 | 手机号（11位） |

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "auditStatus": 0,
    "auditRemark": null,
    "nickname": "张三",
    "phone": "138****0000",
    "createTime": "2025-07-06 10:00:00"
  }
}
```

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "auditStatus": 2,
    "auditRemark": "提交的资料不完整，请补充后重新注册",
    "nickname": "张三",
    "phone": "138****0000",
    "createTime": "2025-07-06 10:00:00"
  }
}
```

> **说明：** 返回脱敏手机号（中间四位用 * 替换）。`auditRemark` 仅在 auditStatus=2 时有值。

**失败响应:**
```json
{
  "code": 10010,
  "msg": "手机号未注册",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10010 | 手机号未注册 |

---

### 5. 驳回后重新提交审核（新增）

- **方法**: `POST`
- **路径**: `/api/app/auth/resubmit`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Body | String | 是 | 手机号（11位） |
| password | Body | String | 是 | 新密码（6-64位） |
| code | Body | String | 是 | 短信验证码（6位，场景 REGISTER） |
| nickname | Body | String | 否 | 昵称（最长64位），不传则保持原昵称 |

**请求体示例:**
```json
{
  "phone": "13800138000",
  "password": "newPassword456",
  "code": "654321",
  "nickname": "张三（更新）"
}
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "user": {
      "id": 1,
      "phone": "13800138000",
      "username": null,
      "nickname": "张三（更新）",
      "avatar": null,
      "email": null,
      "status": 1,
      "auditStatus": 0,
      "auditRemark": null,
      "auditTime": null,
      "createTime": "2025-07-06 10:00:00",
      "updateTime": "2025-07-06 11:00:00"
    }
  }
}
```

> **说明：** 仅当用户 auditStatus=2（已驳回）时允许重新提交。提交后 auditStatus 重置为 0（待审核），清空 auditRemark 和 auditTime。

**失败响应:**
```json
{
  "code": 10020,
  "msg": "当前状态不允许重新提交，仅审核驳回后可操作",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10010 | 手机号未注册 |
| 10012 | 验证码已过期，请重新获取 |
| 10013 | 验证码错误 |
| 10020 | 当前状态不允许重新提交，仅审核驳回后可操作 |

---

### 6. 分页查询 App 用户（修改现有）

- **方法**: `GET`
- **路径**: `/api/admin/users`
- **认证**: 是（Admin）

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 | 变更 |
|--------|------|------|------|------|------|
| page | Query | Long | 否 | 页码，默认1 | 保持 |
| size | Query | Long | 否 | 每页条数，默认10 | 保持 |
| username | Query | String | 否 | 用户名模糊搜索 | 保持 |
| auditStatus | Query | Integer | 否 | 审核状态筛选：0/1/2 | **新增** |

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "phone": "13800138000",
        "username": null,
        "nickname": "张三",
        "avatar": null,
        "email": null,
        "status": 1,
        "auditStatus": 0,
        "auditRemark": null,
        "auditTime": null,
        "createTime": "2025-07-06 10:00:00",
        "updateTime": "2025-07-06 10:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1
  }
}
```

> **变更说明：** UserPageQuery 新增 `auditStatus` 筛选参数；UserVO 新增 `auditStatus`、`auditRemark`、`auditTime` 字段。

---

### 7. 审核用户（新增）

- **方法**: `POST`
- **路径**: `/api/admin/users/{id}/audit`
- **认证**: 是（Admin）

**路径参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 用户 ID |

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| auditStatus | Body | Integer | 是 | 审核结果：1-通过，2-拒绝 |
| auditRemark | Body | String | 否 | 驳回原因（拒绝时必填，最长255位） |

**请求体示例:**
```json
{
  "auditStatus": 1
}
```

```json
{
  "auditStatus": 2,
  "auditRemark": "提交的资料不完整，请补充后重新注册"
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
    "username": null,
    "nickname": "张三",
    "avatar": null,
    "email": null,
    "status": 1,
    "auditStatus": 1,
    "auditRemark": null,
    "auditTime": "2025-07-06 14:00:00",
    "createTime": "2025-07-06 10:00:00",
    "updateTime": "2025-07-06 14:00:00"
  }
}
```

**失败响应:**
```json
{
  "code": 10002,
  "msg": "用户不存在",
  "data": null
}
```

```json
{
  "code": 10019,
  "msg": "该用户已审核，无需重复操作",
  "data": null
}
```

**错误码:**
| 错误码 | 描述 |
|--------|------|
| 10002 | 用户不存在 |
| 10019 | 该用户已审核，无需重复操作 |
| 400 | 请求参数错误（auditStatus 不合法、拒绝时未填 auditRemark） |

---

## 错误码总览

| 错误码 | 描述 | 归属枚举 | 变更 |
|--------|------|----------|------|
| 10002 | 用户不存在 | UserResultCode | 保持 |
| 10004 | 手机号或密码错误 | UserResultCode | 保持 |
| 10010 | 手机号未注册 | AuthResultCode | 保持 |
| 10011 | 手机号已注册 | AuthResultCode | 保持 |
| 10012 | 验证码已过期，请重新获取 | AuthResultCode | 保持 |
| 10013 | 验证码错误 | AuthResultCode | 保持 |
| 10017 | 账号审核中，请耐心等待管理员审核 | AuthResultCode | **新增** |
| 10018 | 注册审核未通过 | AuthResultCode | **新增** |
| 10019 | 该用户已审核，无需重复操作 | UserResultCode | **新增** |
| 10020 | 当前状态不允许重新提交，仅审核驳回后可操作 | AuthResultCode | **新增** |
