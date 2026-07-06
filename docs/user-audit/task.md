# 用户注册审核 - 执行任务清单

## 后端任务 (Spring Boot)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：数据层

- [ ] **Task B1: 修改 User 实体，新增审核字段**
  - 文件: `backend/src/main/java/com/shadow/backend/user/entity/User.java`
  - 变更: 新增 `auditStatus`（Integer, DEFAULT 1）、`auditRemark`（String）、`auditTime`（LocalDateTime）字段
  - 依赖: 无
  - 参考: domain.md 中的 User 实体定义

- [ ] **Task B2: 更新数据库 Schema**
  - 文件: `backend/src/main/resources/sql/schema.sql`
  - 变更: app_user 表新增 `audit_status`（TINYINT NOT NULL DEFAULT 1）、`audit_remark`（VARCHAR(255)）、`audit_time`（DATETIME）字段，新增 `idx_audit_status` 索引
  - 依赖: B1

### 阶段二：常量与错误码

- [ ] **Task B3: 创建 AuditStatus 枚举**
  - 文件: `backend/src/main/java/com/shadow/backend/user/constant/AuditStatus.java`
  - 内容: 枚举值 PENDING(0) / APPROVED(1) / REJECTED(2)，含 `fromValue(Integer)` 静态方法
  - 依赖: 无
  - 参考: domain.md 中的 AuditStatus 枚举定义

- [ ] **Task B4: 修改 AuthResultCode，新增审核错误码**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/response/AuthResultCode.java`
  - 变更: 新增 `USER_AUDIT_PENDING(10017, "账号审核中，请耐心等待管理员审核")`、`USER_AUDIT_REJECTED(10018, "注册审核未通过")`
  - 依赖: 无
  - 参考: domain.md 中的 AuthResultCode 枚举定义

- [ ] **Task B5: 修改 UserResultCode，新增已审核错误码**
  - 文件: `backend/src/main/java/com/shadow/backend/user/response/UserResultCode.java`
  - 变更: 新增 `USER_ALREADY_AUDITED(10019, "该用户已审核，无需重复操作")`
  - 依赖: 无
  - 参考: domain.md 中的 UserResultCode 枚举定义

### 阶段三：DTO 与 VO

- [ ] **Task B6: 修改 UserVO，新增审核字段**
  - 文件: `backend/src/main/java/com/shadow/backend/user/vo/UserVO.java`
  - 变更: 新增 `auditStatus`（Integer）、`auditRemark`（String）、`auditTime`（LocalDateTime）字段
  - 依赖: 无
  - 参考: domain.md 中的 UserVO 定义

- [ ] **Task B7: 创建 RegisterResponse DTO**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/dto/RegisterResponse.java`
  - 内容: 仅包含 `user`（UserVO）字段，替代注册时返回的 LoginResponse
  - 依赖: B6

- [ ] **Task B8: 创建 AuditStatusResponse VO**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/vo/AuditStatusResponse.java`
  - 内容: 包含 `auditStatus`（Integer）、`auditRemark`（String）字段
  - 依赖: 无

- [ ] **Task B9: 创建 AuditUserRequest DTO**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/user/dto/AuditUserRequest.java`
  - 内容: 包含 `auditStatus`（Integer, 1或2）、`auditRemark`（String, 拒绝时必填）字段，含校验注解
  - 依赖: 无

- [ ] **Task B10: 修改 UserPageQuery，新增审核状态筛选**
  - 文件: `backend/src/main/java/com/shadow/backend/user/dto/UserPageQuery.java`
  - 变更: 新增 `auditStatus`（Integer）字段
  - 依赖: 无

### 阶段四：Service 层

- [ ] **Task B11: 修改 UserServiceImpl，支持审核相关操作**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/user/service/UserService.java`
    - `backend/src/main/java/com/shadow/backend/user/service/impl/UserServiceImpl.java`
  - 变更:
    - 新增 `UserVO auditUser(Long userId, AuditUserRequest req)` — 审核用户，校验当前状态为待审核，更新 auditStatus/auditRemark/auditTime
    - 修改 `toVO()` — 映射 auditStatus, auditRemark, auditTime 字段
    - 修改 `page()` — 支持按 auditStatus 筛选
    - 新增 `User getByPhoneWithDeleted(String phone)` 或修改 getByPhone — 用于注册时查询包含被拒绝的用户
  - 依赖: B1, B6, B9, B10

- [ ] **Task B12: 修改 AuthServiceImpl，注册和登录增加审核逻辑**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/service/AuthService.java`
    - `backend/src/main/java/com/shadow/backend/auth/service/impl/AuthServiceImpl.java`
  - 变更:
    - 修改 `register()`:
      - 返回值从 `LoginResponse` 改为 `RegisterResponse`
      - 用户创建时设 `auditStatus = 0`（待审核）
      - 手机号已存在且 `auditStatus = 2`（被拒绝）时，覆盖更新用户记录（新密码、重置 auditStatus=0、清空 auditRemark/auditTime）
      - 手机号已存在且 `auditStatus = 0 或 1` 时，抛出 PHONE_ALREADY_REGISTERED
      - 不再生成 Token
    - 修改 `loginByPassword()`:
      - 密码验证通过后、检查 status 前，新增审核状态校验
      - auditStatus = 0 → 抛出 USER_AUDIT_PENDING(10017)
      - auditStatus = 2 → 抛出 USER_AUDIT_REJECTED(10018, 含 auditRemark)
    - 修改 `loginBySms()`:
      - 同 loginByPassword，新增审核状态校验
    - 新增 `AuditStatusResponse getAuditStatus(String phone)` — 按手机号查询审核状态
  - 依赖: B3, B4, B7, B8, B11
  - 参考: domain.md 中的业务逻辑变更说明

### 阶段五：Controller 层

- [ ] **Task B13: 修改 AuthController，注册返回 RegisterResponse + 新增审核状态查询**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/controller/AuthController.java`
  - 变更:
    - 修改 `register()` — 返回类型从 `Result<LoginResponse>` 改为 `Result<RegisterResponse>`
    - 新增 `GET /api/app/auth/audit-status` — 接收 `phone` 查询参数，调用 `authService.getAuditStatus(phone)`，返回 `Result<AuditStatusResponse>`
  - 依赖: B12

- [ ] **Task B14: 扩展 AdminUserController，新增审核接口**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/user/controller/AdminUserController.java`
  - 变更:
    - 新增 `POST /api/admin/users/{id}/audit` — 接收 `AuditUserRequest`，调用 `userService.auditUser(id, req)`，返回 `Result<UserVO>`
  - 依赖: B9, B11

### 阶段六：配置更新

- [ ] **Task B15: 更新 SaTokenConfigure 免登录白名单**
  - 文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`
  - 变更: App 拦截器 excludePathPatterns 新增 `/api/app/auth/audit-status`
  - 依赖: 无
  - 参考: domain.md 中的 Sa-Token 配置变更

---

## 前端任务 (Flutter)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：模型与数据源

- [ ] **Task F1: 修改 UserModel，新增审核字段**
  - 文件: `native_app/lib/features/user/models/user_model.dart`
  - 变更: UserModel 新增 `auditStatus`（int?）、`auditRemark`（String?）、`auditTime`（String?）字段
  - 依赖: 无
  - 注意: 修改后必须执行 `dart run build_runner build --delete-conflicting-outputs`

- [ ] **Task F2: 修改 Auth 模型，新增 RegisterResponse 和 AuditStatusResponse**
  - 文件: `native_app/lib/features/auth/models/auth_models.dart`
  - 变更:
    - 新增 `RegisterResponse` — 仅含 `user`（UserModel）字段
    - 新增 `AuditStatusResponse` — 含 `auditStatus`（int）、`auditRemark`（String?）字段
  - 依赖: F1
  - 注意: 修改后必须执行 `dart run build_runner build --delete-conflicting-outputs`

- [ ] **Task F3: 修改 AuthRemoteDataSource，注册返回变更 + 新增审核状态查询**
  - 文件: `native_app/lib/features/auth/datasources/auth_remote_datasource.dart`
  - 变更:
    - 修改 `register()` — 返回值语义不变（Map），但响应体仅含 `user` 对象（无 token）
    - 新增 `getAuditStatus(String phone)` — `GET /auth/audit-status?phone=xxx`，返回 `Map<String, dynamic>`
  - 依赖: F2

- [ ] **Task F4: 修改 AuthRepositoryImpl，注册不保存 Token + 新增审核状态查询**
  - 文件: `native_app/lib/features/auth/repositories/auth_repository_impl.dart`
  - 变更:
    - 修改 `register()` — 不再调用 `_handleLoginResponse` 保存 Token；解析 `RegisterResponse`（仅含 user），返回 `RegisterResponse`
    - 新增 `getAuditStatus(String phone)` — 调用 DataSource，解析返回 `AuditStatusResponse`
  - 依赖: F3
  - 修改接口: `AuthRepository` 接口同步修改 `register` 返回值类型和新增 `getAuditStatus`

### 阶段二：状态管理

- [ ] **Task F5: 修改 RegisterViewModel，返回值变更**
  - 文件: `native_app/lib/features/auth/view_model/register_view_model.dart`
  - 变更:
    - `register()` 返回值从 `Future<bool>` 改为 `Future<String?>`
    - 成功时返回手机号 `phone`（供页面跳转审核页时传参）
    - 失败时返回 `null`
  - 依赖: F4

- [ ] **Task F6: 修改 LoginViewModel，新增错误码记录**
  - 文件: `native_app/lib/features/auth/view_model/login_view_model.dart`
  - 变更:
    - `LoginState` 新增 `errorCode`（int?）字段
    - `loginByPassword()` 和 `loginBySms()` 在 `ApiException` 捕获时，记录 `e.code` 到 `errorCode`
  - 依赖: 无

- [ ] **Task F7: 创建 AccountReviewViewModel**
  - 文件: `native_app/lib/features/auth/view_model/account_review_view_model.dart`
  - 内容:
    - `AccountReviewState`（Freezed）— 含 `isLoading`、`auditStatus`、`auditRemark`、`errorMessage`
    - `AccountReviewViewModel`（Notifier）— 含 `checkAuditStatus(String phone)` 方法
  - 依赖: F4

- [ ] **Task F8: 更新 auth_provider.dart，新增 Provider**
  - 文件: `native_app/lib/features/auth/view_model/auth_provider.dart`
  - 变更: 新增 `accountReviewViewModelProvider`
  - 依赖: F7

### 阶段三：页面视图

- [ ] **Task F9: 修改 RegisterPage，注册成功后跳转审核页**
  - 文件: `native_app/lib/features/auth/view/register_page.dart`
  - 变更:
    - `_register()` 方法中，`register()` 返回值从 `bool` 改为 `String?`
    - 返回非 null（成功）时跳转 `/account-review?phone=xxx`
    - 返回 null（失败）时显示错误信息（逻辑不变）
  - 依赖: F5

- [ ] **Task F10: 修改 LoginPage，处理审核错误码**
  - 文件: `native_app/lib/features/auth/view/login_page.dart`
  - 变更:
    - 监听 `LoginState.errorCode`，当为 10017（待审核）时，SnackBar 中增加「查看审核状态」按钮，点击跳转 `/account-review?phone=xxx`
    - 当为 10018（审核拒绝）时，SnackBar 中增加「重新注册」按钮，点击跳转 `/register`
  - 依赖: F6

- [ ] **Task F11: 创建 AccountReviewPage**
  - 文件: `native_app/lib/features/auth/view/account_review_page.dart`
  - 内容:
    - 接收 `phone` 参数
    - 根据审核状态显示不同 UI（待审核 / 已通过 / 已拒绝）
    - 待审核：显示「刷新状态」和「返回登录」按钮
    - 已通过：显示「去登录」按钮，跳转 `/login`
    - 已拒绝：显示拒绝原因和「重新注册」按钮，跳转 `/register`
    - 页面加载时自动查询一次审核状态
  - 依赖: F7, F8

### 阶段四：路由注册

- [ ] **Task F12: 更新路由配置**
  - 文件: `native_app/lib/core/router/app_router.dart`
  - 变更:
    - 新增路由路径常量: `static const String accountReview = '/account-review'`
    - 免登录白名单 `_publicRoutes` 新增 `RoutePaths.accountReview`
    - 新增 GoRoute 定义，builder 读取 `phone` 查询参数传给 AccountReviewPage
  - 依赖: F11

---

## 管理端任务 (React + TanStack Router)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：类型与 API 服务

- [ ] **Task A1: 新增管理端类型定义**
  - 文件: `admin/src/types/api.ts`
  - 变更: 新增 `AppUserVO`、`AuditUserRequest` 接口定义
  - 依赖: 无
  - 参考: ui.md 中的管理端类型定义

- [ ] **Task A2: 创建 App 用户 API 服务**
  - 文件: `admin/src/services/api/appUser.ts`
  - 内容:
    - `page(params)` — `GET /api/admin/users`，支持 `current`、`size`、`username`、`auditStatus` 参数
    - `audit(id, data)` — `POST /api/admin/users/{id}/audit`
  - 依赖: A1

### 阶段二：页面视图

- [ ] **Task A3: 创建 AppUserPage**
  - 文件: `admin/src/pages/AppUserPage.tsx`
  - 内容:
    - 分页查询 App 用户列表（useQuery）
    - 用户名搜索 + 审核状态筛选（Select 组件）
    - Table 展示用户列表（手机号、用户名、昵称、审核状态 Badge、注册时间）
    - 待审核用户行显示「通过」和「拒绝」操作按钮
    - 「通过」直接调用审核 API
    - 「拒绝」弹出 Dialog 填写拒绝原因后调用审核 API
    - 审核成功后刷新列表（queryClient.invalidateQueries）
    - 分页导航
  - 依赖: A2

### 阶段三：路由与菜单

- [ ] **Task A4: 注册路由**
  - 文件: `admin/src/app/router.tsx`
  - 变更:
    - 导入 `AppUserPage`
    - 新增 `appUserRoute` 路由定义（path: `/app-users`）
    - 将 `appUserRoute` 加入 `adminRoute.addChildren`
  - 依赖: A3

- [ ] **Task A5: 新增侧边栏菜单入口**
  - 文件: `admin/src/layouts/AdminLayout.tsx`
  - 变更: 侧边栏菜单新增「App 用户管理」项，路径 `/app-users`
  - 依赖: A4

---

## 任务依赖关系总览

```
后端:
B1 → B2 (Schema)
B3, B4, B5 (常量/错误码, 并行)
B6 → B7, B8 (VO/DTO)
B9, B10 (DTO, 并行)
B1, B6, B9, B10 → B11 (UserService)
B3, B4, B7, B8, B11 → B12 (AuthService)
B12 → B13 (AuthController)
B9, B11 → B14 (AdminUserController)
B15 (配置, 独立)

Flutter:
F1 → F2 (模型)
F2 → F3 (DataSource)
F3 → F4 (Repository)
F4 → F5 (RegisterViewModel)
F4 → F7 (AccountReviewViewModel)
F7 → F8 (Provider)
F5 → F9 (RegisterPage)
F6 → F10 (LoginPage)
F7, F8 → F11 (AccountReviewPage)
F11 → F12 (Router)

管理端:
A1 → A2 (API)
A2 → A3 (Page)
A3 → A4 (Router)
A4 → A5 (Menu)
```
