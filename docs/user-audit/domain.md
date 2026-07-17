# 用户注册审核 - 数据模型文档

## 实体变更

### User（用户实体，修改现有）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/entity/User.java`

| 字段 | 类型 | 约束 | 说明 | 变更 |
|------|------|------|------|------|
| id | Long | PK, AUTO_INCREMENT | 主键 | 保持 |
| phone | String(20) | NOT NULL, UNIQUE | 手机号（核心标识） | 保持 |
| username | String(32) | NULL, UNIQUE | 用户名 | 保持 |
| password | String(255) | NOT NULL | 密码（Argon2 加密） | 保持 |
| nickname | String(64) | NULL | 昵称 | 保持 |
| avatar | String(255) | NULL | 头像 URL | 保持 |
| email | String(128) | NULL | 邮箱 | 保持 |
| status | Integer | NOT NULL, DEFAULT 1 | 状态：0-禁用，1-启用 | 保持 |
| auditStatus | Integer | NOT NULL, DEFAULT 1 | 审核状态：0-待审核，1-已通过，2-已拒绝 | **新增** |
| auditRemark | String(255) | NULL | 审核备注/驳回原因 | **新增** |
| auditTime | LocalDateTime | NULL | 审核时间 | **新增** |
| deleted | Integer | NOT NULL, DEFAULT 0 | 逻辑删除 | 保持 |
| createTime | LocalDateTime | NOT NULL, AUTO FILL | 创建时间 | 保持 |
| updateTime | LocalDateTime | NOT NULL, AUTO FILL | 更新时间 | 保持 |

> **变更说明：** 新增 `auditStatus`（NOT NULL, DEFAULT 1）、`auditRemark`（NULL）、`auditTime`（NULL）三个字段。现有用户默认 `auditStatus = 1`（已通过），新注册用户 `auditStatus = 0`（待审核）。

## VO 变更

### UserVO（修改现有）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/vo/UserVO.java`

新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| auditStatus | Integer | 审核状态：0-待审核，1-已通过，2-已拒绝 |
| auditRemark | String | 审核备注/驳回原因 |
| auditTime | LocalDateTime | 审核时间 |

### AuditStatusVO（新增）

> 对应文件: `backend/src/main/java/com/shadow/backend/auth/vo/AuditStatusVO.java`

审核状态查询响应，用于免登录场景，仅返回脱敏信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| auditStatus | Integer | 审核状态：0-待审核，1-已通过，2-已拒绝 |
| auditRemark | String | 驳回原因（仅 auditStatus=2 时有值） |
| nickname | String | 昵称 |
| phone | String | 掩码手机号（如 138****0000） |
| createTime | LocalDateTime | 注册时间 |

## DTO 变更

### RegisterResponse（新增）

> 对应文件: `backend/src/main/java/com/shadow/backend/auth/dto/RegisterResponse.java`

注册成功响应，不再返回 Token。

| 字段 | 类型 | 说明 |
|------|------|------|
| user | UserVO | 用户信息（含 auditStatus） |

### ResubmitRequest（新增）

> 对应文件: `backend/src/main/java/com/shadow/backend/auth/dto/ResubmitRequest.java`

驳回后重新提交审核请求。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | String | 是 | 手机号（11位） |
| password | String | 是 | 新密码（6-64位） |
| code | String | 是 | 短信验证码（6位，场景 REGISTER） |
| nickname | String | 否 | 昵称（最长64位） |

### AuditUserRequest（新增）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/dto/AuditUserRequest.java`

管理员审核请求。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auditStatus | Integer | 是 | 审核结果：1-通过，2-拒绝 |
| auditRemark | String | 否 | 驳回原因（拒绝时必填，最长255位） |

### UserPageQuery（修改现有）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/dto/UserPageQuery.java`

新增字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| auditStatus | Integer | 否 | 审核状态筛选：0-待审核，1-已通过，2-已拒绝 |

## 枚举定义

### AuditStatus（新增）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/constant/AuditStatus.java`

| 枚举值 | 值 | 描述 |
|--------|-----|------|
| PENDING | 0 | 待审核 |
| APPROVED | 1 | 已通过 |
| REJECTED | 2 | 已拒绝 |

含 `fromValue(Integer)` 静态方法，通过整数值获取枚举实例。

## 错误码变更

### AuthResultCode（修改现有）

> 对应文件: `backend/src/main/java/com/shadow/backend/auth/response/AuthResultCode.java`

新增错误码：

| 枚举名 | 值 | 描述 |
|--------|-----|------|
| USER_AUDIT_PENDING | 10017 | 账号审核中，请耐心等待管理员审核 |
| USER_AUDIT_REJECTED | 10018 | 注册审核未通过 |
| RESUBMIT_NOT_REJECTED | 10020 | 当前状态不允许重新提交，仅审核驳回后可操作 |

### UserResultCode（修改现有）

> 对应文件: `backend/src/main/java/com/shadow/backend/user/response/UserResultCode.java`

新增错误码：

| 枚举名 | 值 | 描述 |
|--------|-----|------|
| USER_ALREADY_AUDITED | 10019 | 该用户已审核，无需重复操作 |

## 数据库表结构变更

### app_user 表新增字段

```sql
-- 用户注册审核功能 - app_user 表新增字段
ALTER TABLE app_user
    ADD COLUMN audit_status TINYINT NOT NULL DEFAULT 1 COMMENT '审核状态：0-待审核，1-已通过，2-已拒绝' AFTER status,
    ADD COLUMN audit_remark VARCHAR(255) DEFAULT NULL COMMENT '审核备注/驳回原因' AFTER audit_status,
    ADD COLUMN audit_time DATETIME DEFAULT NULL COMMENT '审核时间' AFTER audit_remark,
    ADD INDEX idx_audit_status (audit_status);
```

> 现有用户 `audit_status` 默认为 1（已通过），不影响现有用户登录。

## Sa-Token 配置变更

> 对应文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`

**免登录白名单更新（excludePathPatterns 新增）：**

| 新增路径 | 说明 |
|----------|------|
| `/api/app/auth/audit-status` | 审核状态查询（免登录） |
| `/api/app/auth/resubmit` | 驳回后重新提交（免登录） |

## 业务逻辑变更说明

### 注册流程变更

```
旧流程: 验证验证码 → 检查手机号 → 创建用户(status=1) → 生成双Token → 返回 LoginResponse
新流程: 验证验证码 → 检查手机号 → 创建用户(status=1, auditStatus=0) → 返回 RegisterResponse（无Token）
```

**注册时手机号已存在的处理逻辑：**
```
验证验证码 → 查手机号 → 手机号存在？
  ├─ 不存在 → 创建新用户(auditStatus=0) → 返回 RegisterResponse
  └─ 存在 → 抛出 PHONE_ALREADY_REGISTERED 异常
```

> 注意：注册接口不再处理「驳回后重新注册」逻辑，该逻辑由独立的 `/resubmit` 接口处理。

### 重新提交流程（新增）

```
验证验证码 → 查手机号 → 手机号存在且 auditStatus=2？
  ├─ 是 → 更新用户(新密码, 新昵称, auditStatus=0, auditRemark=null, auditTime=null) → 返回 RegisterResponse
  └─ 否 → 抛出 RESUBMIT_NOT_REJECTED 异常
```

### 登录流程变更

```
旧流程: 验证密码/验证码 → 检查status → 生成双Token → 返回 LoginResponse
新流程: 验证密码/验证码 → 检查auditStatus → 检查status → 生成双Token → 返回 LoginResponse
         │
         ├─ auditStatus=0(待审核) → 抛出 USER_AUDIT_PENDING(10017)
         ├─ auditStatus=2(已拒绝) → 抛出 USER_AUDIT_REJECTED(10018, 含auditRemark)
         └─ auditStatus=1(已通过) → 继续检查status → 正常登录
```

### 审核操作逻辑

```
管理员发起审核 → 查用户 → 用户存在？
  ├─ 不存在 → 抛出 USER_NOT_FOUND(10002)
  └─ 存在 → auditStatus=0(待审核)？
      ├─ 是 → 更新 auditStatus、auditRemark、auditTime → 返回 UserVO
      └─ 否 → 抛出 USER_ALREADY_AUDITED(10019)
```
