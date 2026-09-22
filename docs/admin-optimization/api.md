# Admin 工程优化 - 接口约束文档

## 接口总览

本功能**不新增接口**，仅扩展现有接口的查询参数与校验规则：

| 方法 | 路径 | 变更类型 | 认证 |
|------|------|----------|------|
| GET | /api/admin/admin-users | 新增 `roleId`、`status` 查询参数 | 是 |
| GET | /api/admin/roles | 新增 `status` 查询参数 | 是 |
| POST | /api/admin/menus | 新增父级校验（3 个错误码） | 是 |
| PUT | /api/admin/menus/{id} | 新增父级校验（3 个错误码） | 是 |
| POST | /api/admin/auth/logout | 无变更（前端补调用，在此登记约束） | 是 |

所有响应沿用 `Result<T>` / `PageResult<T>` 统一包装，本功能不改变响应结构。

## 接口详情

### 1. 分页查询管理员（扩展）

- **方法**: `GET`
- **路径**: `/api/admin/admin-users`
- **认证**: 是

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| current | Query | Long | 否 | 页码，默认 1 |
| size | Query | Long | 否 | 每页条数，默认 10 |
| username | Query | String | 否 | 用户名模糊匹配（现有） |
| roleId | Query | Long | 否 | **新增**：按角色 ID 过滤（精确） |
| status | Query | Integer | 否 | **新增**：按状态过滤，0=禁用 / 1=启用 |

**实现约束（Service 层）:**

- `roleId` 过滤：先查 `sys_user_role` 得到关联 `userId` 集合，再以 `IN` 条件并入用户查询；关联为空时直接返回空 `PageResult`（不执行用户分页查询）
- `status` 过滤：`eq(SysUser::getStatus, status)`
- 两个参数与 `username` 可任意组合，均为 AND 语义

**成功响应（结构不变）:**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "current": 1, "size": 10, "total": 3, "pages": 1,
    "records": [ { "id": 1, "username": "admin", "roles": [ ... ] } ]
  }
}
```

### 2. 分页查询角色（扩展）

- **方法**: `GET`
- **路径**: `/api/admin/roles`
- **认证**: 是

**请求参数:**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| current | Query | Long | 否 | 页码，默认 1 |
| size | Query | Long | 否 | 每页条数，默认 10 |
| name | Query | String | 否 | 角色名模糊匹配（现有） |
| status | Query | Integer | 否 | **新增**：按状态过滤，0=禁用 / 1=启用 |

**实现约束:** `eq(SysRole::getStatus, status)`，与 `name` 为 AND 语义；实现方式与现有 `name` 过滤一致（`LambdaQueryWrapper`）。

### 3. 创建菜单 / 4. 修改菜单（新增校验）

- **方法**: `POST /api/admin/menus`、`PUT /api/admin/menus/{id}`
- **认证**: 是
- **请求体**: 结构不变（`CreateMenuRequest` / `UpdateMenuRequest`）

**新增校验规则（Service 层，create 与 update 均执行）:**

设 `parentId` 为请求父级 ID，`selfId` 为被修改菜单 ID（create 时为 null）：

1. `parentId` 为 null 或 0 → 合法（根节点），跳过后续校验
2. 父级必须存在：`selectById(parentId)` 为 null → 抛 `MENU_PARENT_NOT_FOUND`
3. 父级类型不能为按钮：`parent.type == 3` → 抛 `MENU_PARENT_TYPE_INVALID`
4. 仅 update：`parentId` 不能等于 `selfId` → 抛 `MENU_INVALID_PARENT`
5. 仅 update：`parentId` 不能位于 `selfId` 的子孙子树内（沿 parent 链向上回溯或收集子树判定）→ 抛 `MENU_INVALID_PARENT`

**错误码（新增，登记于 `AdminResultCode`）:**

| 错误码 | 枚举 | 描述 |
|--------|------|------|
| 20103 | MENU_PARENT_NOT_FOUND | 父级菜单不存在 |
| 20104 | MENU_INVALID_PARENT | 父级菜单不能为自身或其子菜单 |
| 20105 | MENU_PARENT_TYPE_INVALID | 按钮类型菜单不能作为父级 |

**失败响应示例:**

```json
{ "code": 20104, "msg": "父级菜单不能为自身或其子菜单", "data": null }
```

### 5. 管理员注销（登记现有接口）

- **方法**: `POST`
- **路径**: `/api/admin/auth/logout`
- **认证**: 是

无请求体。成功返回 `{ "code": 200, "msg": "success", "data": null }`。

**前端调用约束（本次变更点）:**

1. 退出登录时携带当前 token 调用本接口，**成功或失败都清理本地状态**（token、Query 缓存）并跳转登录页
2. 调用失败（网络/服务端错误）时以 Toast 警告提示"服务端注销失败，已在本机退出"，不阻塞登出流程
3. 登出请求本身不得触发 401 跳转循环（token 已失效时静默完成本地清理）

## 既有约定重申（本功能不变更）

- 统一响应体 `Result<T>`：`{ code, msg, data }`
- 分页响应 `PageResult<T>`：`{ current, size, total, pages, records }`
- 业务异常统一 `BusinessException` + 模块错误码枚举（实现 `IResultCode`），由 `GlobalExceptionHandler` 统一转换
- 前端错误处理：业务错误码 401 → 清理会话跳登录；403 → 无权限提示；其余 → 展示 msg
