# backend-optimization - 接口约束文档

本次优化**不新增接口**，仅变更既有接口的鉴权要求、校验规则、响应字段与错误码。所有响应继续使用 `Result<T>` 包装；业务异常保持 HTTP 200 + code 约定，鉴权/权限错误保持 HTTP 401/403。

## 一、管理端路由权限映射（新增校验）

所有 `/api/admin/**` 接口在登录校验之上新增权限校验，权限码与菜单种子数据一致。无权限时返回 HTTP 403 + `Result{code:403, msg:"无访问权限"}`。

### 权限映射表

| 路由 | 方法 | 权限码 | 备注 |
|------|------|--------|------|
| /api/admin/auth/login | POST | 免登录 | |
| /api/admin/auth/logout | POST | 仅登录 | |
| /api/admin/auth/me | GET | 仅登录 | |
| /api/admin/auth/permissions | GET | 仅登录 | 前端按钮权限依赖，任何已登录管理员可查自身 |
| /api/admin/menus/tree | GET | 仅登录 | 当前用户侧边栏，任何已登录管理员可查自身 |
| /api/admin/menus/all | GET | menu:list | |
| /api/admin/menus | POST | menu:create | |
| /api/admin/menus/{id} | PUT | menu:update | |
| /api/admin/menus/{id} | DELETE | menu:delete | |
| /api/admin/roles | GET | role:list | 含分页参数校验（见三.4） |
| /api/admin/roles/all | GET | role:list | 角色分配下拉数据 |
| /api/admin/roles/{id} | GET | role:list | |
| /api/admin/roles | POST | role:create | |
| /api/admin/roles/{id} | PUT | role:update | |
| /api/admin/roles/{id} | DELETE | role:delete | |
| /api/admin/roles/{id}/menus | PUT | role:assign | 校验规则见三.3 |
| /api/admin/admin-users | GET | admin-user:list | 含分页参数校验（见三.4） |
| /api/admin/admin-users/{id} | GET | admin-user:list | |
| /api/admin/admin-users | POST | admin-user:create | |
| /api/admin/admin-users/{id} | PUT | admin-user:update | 含最后超管保护（见三.2） |
| /api/admin/admin-users/{id} | DELETE | admin-user:delete | 含最后超管保护（见三.2） |
| /api/admin/admin-users/{id}/roles | PUT | admin-user:assign | 校验规则见三.1 |
| /api/admin/users | GET | user:list | |
| /api/admin/users/{id} | GET | user:list | |
| /api/admin/users | POST | user:list | 决策 D4：暂归入 user:list |
| /api/admin/users/{id} | PUT | user:list | 决策 D4：暂归入 user:list |
| /api/admin/users/{id} | DELETE | user:list | 决策 D4：暂归入 user:list |
| /api/admin/users/{id}/audit | POST | user:audit | 校验规则见三.5 |

> 决策 D4 说明：App 用户的创建/更新/删除操作现有菜单数据无对应按钮权限码，第一版归入 `user:list`；后续细分时补充 `user:create`/`user:update`/`user:delete` 权限码即可，路由映射集中在 `SaTokenConfigure` 一处维护。

## 二、App 端接口行为变更

### 1. 查询注册审核状态（字段收敛）

- **方法**: `GET`
- **路径**: `/api/app/auth/audit-status?phone=`
- **认证**: 否（保持匿名，决策 D1 方案A）

**变更**: 响应 `data` 仅保留 `auditStatus` 与脱敏 `phone`；移除 `auditRemark`、`nickname`、`createTime`。新增查询频率限制：同一手机号 60 秒内仅允许查询 1 次。

**成功响应（变更后）:**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "auditStatus": 0,
    "phone": "138****8000"
  }
}
```

**错误码（新增/沿用）:**

| 错误码 | 描述 |
|--------|------|
| 10010 | 手机号未注册（沿用） |
| 10024 | 查询过于频繁，请稍后再试（新增） |

**前端影响**: native_app 审核页 `account_review_page` 的"驳回原因"行依赖 `auditRemark`，收敛后为 null 不渲染（不崩溃）；驳回原因改由登录失败错误信息透出（既有行为）。

### 2. 刷新 Token（会话撤销联动）

- **方法**: `POST`
- **路径**: `/api/app/auth/refresh`
- **认证**: 否（凭 Refresh Token）

**变更**:
1. Refresh Token 轮换改为原子操作（同一 Token 并发刷新仅一个成功）。
2. 刷新前复核账号状态：审核拒绝、禁用账号的 Refresh Token 直接失效。
3. 重置密码、管理员禁用/删除用户后，该用户全部 Refresh Token 与会话立即撤销。

**错误码:**

| 错误码 | 描述 |
|--------|------|
| 10016 | 刷新令牌无效或已过期（沿用，含并发竞争失败、账号被禁用/重置密码后） |
| 10003 | 账号已被禁用（沿用） |

### 3. 退出登录（设备级撤销）

- **方法**: `POST`
- **路径**: `/api/app/auth/logout`
- **认证**: 是

**变更**: Refresh Token 与 access token 的绑定关系从账号级 Session 迁移到 Token-Session；多设备登录时退出仅撤销当前设备的 token 对，不影响其他设备。

### 4. 发送短信验证码（频控增强）

- **方法**: `POST`
- **路径**: `/api/app/auth/send-code`

**变更**: 在既有 60 秒冷却之外，新增同一手机号每日发送上限（10 次/天）；prod 环境未配置真实短信供应商时返回业务错误，不静默丢弃；数据库与日志不再保存/输出验证码明文。

**错误码（新增）:**

| 错误码 | 描述 |
|--------|------|
| 10023 | 今日验证码发送次数已达上限 |
| 10025 | 短信服务未配置（仅 prod 占位实现时） |

### 5. 短信验证码校验（错误次数限制）

涉及 `/api/app/auth/login/sms`、`/register`、`/reset-password`、`/resubmit` 内部的验证码校验环节。

**变更**: 验证码比较与删除改为原子操作；同一手机号同一场景错误尝试达 5 次后验证码作废，须重新获取。

**错误码（新增）:**

| 错误码 | 描述 |
|--------|------|
| 10022 | 验证码错误次数过多，请重新获取 |

### 6. 重置密码（会话撤销）

- **方法**: `POST`
- **路径**: `/api/app/auth/reset-password`

**变更**: 重置成功后撤销该用户全部会话与 Refresh Token（所有设备需重新登录）。

## 三、管理端接口校验规则变更

### 1. 给管理员分配角色 `PUT /api/admin/admin-users/{id}/roles`

新增校验，按顺序执行：

| 规则 | 失败错误码 |
|------|-----------|
| roleIds 去重 | -（自动处理） |
| 所有 roleId 必须存在且启用 | 20204 包含无效或已停用的角色 |
| 目标角色集合必须是操作者自身角色的子集（防越级授权）；操作者持有 `support` 角色时豁免（超管可分配任意角色） | 20205 不能分配超出自身权限范围的角色 |
| 禁止修改自己的角色集合（防自提权） | 20304 不能修改自己的角色 |

### 2. 禁用/删除管理员 `PUT|DELETE /api/admin/admin-users/{id}`

新增校验：操作会导致系统没有启用的 `support` 角色管理员时拒绝（含禁用、删除、移除 support 角色三种路径），返回 20305。既有"不能删除/禁用自己"规则保留。

**变更**: 禁用或删除管理员成功后，撤销其全部管理端会话。

### 3. 给角色分配菜单 `PUT /api/admin/roles/{id}/menus`

新增校验：menuIds 去重；所有 menuId 必须存在且未删除。失败返回 20206（包含无效的菜单ID）。

### 4. 分页参数校验 `GET /api/admin/admin-users`、`GET /api/admin/roles`

`current`、`size` 增加校验：`current >= 1`、`1 <= size <= 100`，与 `UserPageQuery` 规则一致。越界返回 HTTP 400 + 参数错误消息。

### 5. 审核用户 `POST /api/admin/users/{id}/audit`

**变更**:
1. `auditStatus` 仅允许 `1`（通过）或 `2`（拒绝），传入其他值返回 400。
2. 审核写入改为条件更新（仅当当前状态为待审核时生效），并发重复审核时后到者返回 10019（沿用"该用户已审核"）。

## 四、全局行为变更

| 行为 | 变更前 | 变更后 |
|------|--------|--------|
| 数据库唯一键冲突 | 冒泡为 HTTP 500 | HTTP 200 + `code:409` + "资源冲突" |
| 参数解析类错误消息 | 透出底层异常原文（如 JSON 解析细节） | 字段校验消息保持中文；非字段类错误返回统一"请求参数错误" |
| 停用角色的权限 | 菜单/权限查询仍生效 | 关联查询过滤停用角色，权限即时失效 |
| 初始管理员口令 | 固定 admin123 且日志打印明文 | dev 保持默认；prod 读环境变量 `ADMIN_INITIAL_PASSWORD`，缺失启动失败；日志仅输出用户名 |
| 管理端写操作 | 无审计记录 | 写入 sys_operation_log（管理员ID、方法、URI、脱敏参数、结果码、IP、耗时、traceId） |

## 五、错误码总览（本次新增）

| 模块 | 错误码 | 描述 |
|------|--------|------|
| Auth | 10022 | 验证码错误次数过多，请重新获取 |
| Auth | 10023 | 今日验证码发送次数已达上限 |
| Auth | 10024 | 查询过于频繁，请稍后再试 |
| Auth | 10025 | 短信服务未配置 |
| Admin | 20103 | 父级菜单不存在 |
| Admin | 20104 | 父级菜单不能为自身或其子菜单 |
| Admin | 20105 | 按钮类型菜单不能作为父级 |
| Admin | 20204 | 包含无效或已停用的角色 |
| Admin | 20205 | 不能分配超出自身权限范围的角色 |
| Admin | 20206 | 包含无效的菜单ID |
| Admin | 20304 | 不能修改自己的角色 |
| Admin | 20305 | 系统至少保留一名启用的超级管理员 |
