# 用户注册审核 - 接口约束文档

## 接口总览

### App 端接口（修改现有）

| 方法 | 路径 | 描述 | 认证 | 变更类型 |
|------|------|------|------|----------|
| POST | /api/app/auth/register | 手机号注册 | 否 | **修改**（不再返回 Token） |
| POST | /api/app/auth/login/password | 手机号 + 密码登录 | 否 | **修改**（新增审核校验） |
| POST | /api/app/auth/login/sms | 手机号 + 验证码登录 | 否 | **修改**（新增审核校验） |
| GET | /api/app/auth/audit-status | 查询审核状态 | 否 | **新增** |

### 管理端接口（新增）

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
      "username": "user_13800138000",
      "nickname": "张三",
      "avatar": null,
      "email": null,
      "status": 1,
      "auditStatus": 0,
      "auditRemark": null,
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
| 10011 | 手机号已注册 | 保持（仅当 auditStatus 为 0 或 1 时触发；auditStatus 为 2 时允许重新注册） |
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

**成功响应:** （无变更，同现有格式）

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
  "msg": "注册审核未通过",
  "data": {
    "auditRemark": "提交的资料不完整，请补充后重新注册"
  }
}
```

> **关键变更：** 在密码验证通过后、返回 Token 前，新增审核状态校验。若 `auditStatus = 0` 返回 10017；若 `auditStatus = 2` 返回 10018（含 `auditRemark` 拒绝原因）。

**错误码:**
| 错误码 | 描述 | 变更 |
|--------|------|------|
| 10004 | 手机号或密码错误 | 保持 |
| 10003 | 账号已被禁用 | 保持 |
| 10017 | 账号审核中，请耐心等待管理员审核 | **新增** |
| 10018 | 注册审核未通过 | **新增** |

---

### 3. 手机号 + 验证码登录（修改现有）

- **方法**: `POST`
- **路径**: `/api/app/auth/login/sms`
- **认证**: 否

**请求参数:** （无变更）

**成功响应:** （无变更）

**新增错误码:** 同密码登录（10017、10018）

---

### 4. 查询审核状态（新增）

- **方法**: `GET`
- **路径**: `/api/app/auth/audit-status`
- **认证**: 否

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| phone | Query | String | 是 | 手机号（11位） |

**请求示例:**
```
GET /api/app/auth/audit-status?phone=13800138000
```

**成功响应:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "auditStatus": 0,
    "auditRemark": null
  }
}
```

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "auditStatus": 2,
    "auditRemark": "提交的资料不完整，请补充后重新注册"
  }
}
```

> **说明：** 该接口供 App 端审核状态页面轮询/手动刷新使用。仅返回 `auditStatus` 和 `auditRemark` 两个字段，不暴露用户其他信息。当 `auditStatus = 1`（已通过）时，`auditRemark` 为 null。

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

### 5. 分页查询 App 用户（修改现有）

- **方法**: `GET`
- **路径**: `/api/admin/users`
- **认证**: 是（Admin）

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| page | Query | Long | 否 | 页码，默认 1 |
| size | Query | Long | 否 | 每页条数，默认 10 |
| username | Query | String | 否 | 用户名模糊搜索（保持现有） |
| auditStatus | Query | Integer | 否 | **新增**：审核状态筛选（0-待审核，1-已通过，2-已拒绝），不传则查询全部 |

**请求示例:**
```
GET /api/admin/users?page=1&size=10&auditStatus=0
```

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
        "username": "user_13800138000",
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

> **变更说明：** UserVO 新增 `auditStatus`、`auditRemark`、`auditTime` 字段；UserPageQuery 新增 `auditStatus` 筛选参数。

---

### 6. 审核用户（新增）

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
| auditRemark | Body | String | 否 | 审核备注/拒绝原因（拒绝时必填，最长255位） |

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
    "username": "user_13800138000",
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

## 错误码总览（增量）

| 错误码 | 描述 | 来源 | 变更 |
|--------|------|------|------|
| 10010 | 手机号未注册 | AuthResultCode | 保持 |
| 10011 | 手机号已注册 | AuthResultCode | 保持 |
| 10017 | 账号审核中，请耐心等待管理员审核 | AuthResultCode | **新增** |
| 10018 | 注册审核未通过 | AuthResultCode | **新增** |
| 10019 | 该用户已审核，无需重复操作 | UserResultCode | **新增** |

---

## 免登录白名单更新

> 对应文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`

App 拦截器 `excludePathPatterns` 新增：

| 新增路径 | 说明 |
|----------|------|
| `/api/app/auth/audit-status` | 审核状态查询（免登录） |

> **注意：** 该接口使用 GET 方法且需在免登录白名单中，确保未登录用户可查询审核状态。
