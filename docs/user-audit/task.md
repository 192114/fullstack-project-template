# 用户注册审核 - 执行任务清单

<!-- targets: backend,native_app,admin -->

## 目标工程
- [x] backend (Spring Boot)
- [x] native_app (Flutter)
- [x] admin (React)

---

## 后端任务 (Spring Boot)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：数据层

- [x] **Task B1: 修改 User 实体，新增审核字段**
  - 文件: `backend/src/main/java/com/shadow/backend/user/entity/User.java`
  - 变更: 新增 `auditStatus`（Integer, DEFAULT 1）、`auditRemark`（String）、`auditTime`（LocalDateTime）字段
  - 依赖: 无
  - 参考: domain.md 中的 User 实体定义

- [x] **Task B2: 更新数据库 Schema**
  - 文件: `backend/src/main/resources/sql/schema.sql`
  - 变更: app_user 表新增 `audit_status`（TINYINT NOT NULL DEFAULT 1）、`audit_remark`（VARCHAR(255)）、`audit_time`（DATETIME）字段，新增 `idx_audit_status` 索引
  - 依赖: B1

### 阶段二：常量与错误码

- [x] **Task B3: 创建 AuditStatus 枚举**
  - 文件: `backend/src/main/java/com/shadow/backend/user/constant/AuditStatus.java`
  - 内容: 枚举值 PENDING(0) / APPROVED(1) / REJECTED(2)，含 `fromValue(Integer)` 静态方法
  - 依赖: 无
  - 参考: domain.md 中的 AuditStatus 枚举定义

- [x] **Task B4: 修改 AuthResultCode，新增审核错误码**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/response/AuthResultCode.java`
  - 变更: 新增 `USER_AUDIT_PENDING(10017)`、`USER_AUDIT_REJECTED(10018)`、`RESUBMIT_NOT_REJECTED(10020)`
  - 依赖: 无
  - 参考: domain.md 中的 AuthResultCode 枚举定义

- [x] **Task B5: 修改 UserResultCode，新增已审核错误码**
  - 文件: `backend/src/main/java/com/shadow/backend/user/response/UserResultCode.java`
  - 变更: 新增 `USER_ALREADY_AUDITED(10019, "该用户已审核，无需重复操作")`
  - 依赖: 无
  - 参考: domain.md 中的 UserResultCode 枚举定义

### 阶段三：DTO / VO

- [x] **Task B6: 修改 UserVO，新增审核字段**
  - 文件: `backend/src/main/java/com/shadow/backend/user/vo/UserVO.java`
  - 变更: 新增 `auditStatus`（Integer）、`auditRemark`（String）、`auditTime`（LocalDateTime）字段
  - 依赖: B1

- [x] **Task B7: 修改 UserPageQuery，新增审核状态筛选**
  - 文件: `backend/src/main/java/com/shadow/backend/user/dto/UserPageQuery.java`
  - 变更: 新增 `auditStatus`（Integer）字段
  - 依赖: 无

- [x] **Task B8: 创建 RegisterResponse DTO**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/dto/RegisterResponse.java`
  - 内容: 仅含 `user`（UserVO）字段，不含 Token
  - 依赖: B6

- [x] **Task B9: 创建 AuditStatusVO**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/vo/AuditStatusVO.java`
  - 内容: `auditStatus`、`auditRemark`、`nickname`、`phone`（掩码）、`createTime` 字段
  - 依赖: 无
  - 参考: domain.md 中的 AuditStatusVO 定义

- [x] **Task B10: 创建 ResubmitRequest DTO**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/dto/ResubmitRequest.java`
  - 内容: `phone`、`password`、`code`、`nickname` 字段，含校验注解
  - 依赖: 无
  - 参考: domain.md 中的 ResubmitRequest 定义

- [x] **Task B11: 创建 AuditUserRequest DTO**
  - 文件: `backend/src/main/java/com/shadow/backend/user/dto/AuditUserRequest.java`
  - 内容: `auditStatus`（Integer, 必填）、`auditRemark`（String, 拒绝时必填）字段
  - 依赖: 无
  - 参考: domain.md 中的 AuditUserRequest 定义

### 阶段四：Service 层

- [x] **Task B12: 修改 UserServiceImpl，更新分页查询和 toVO**
  - 文件: `backend/src/main/java/com/shadow/backend/user/service/impl/UserServiceImpl.java`
  - 变更:
    - `page()` 方法新增 `auditStatus` 条件筛选
    - `toVO()` 方法映射 `auditStatus`、`auditRemark`、`auditTime` 字段
    - 新增 `audit(Long id, Integer auditStatus, String auditRemark)` 方法
  - 依赖: B1, B6, B7, B11

- [x] **Task B13: 修改 UserService 接口，新增 audit 方法**
  - 文件: `backend/src/main/java/com/shadow/backend/user/service/UserService.java`
  - 变更: 新增 `UserVO audit(Long id, Integer auditStatus, String auditRemark)` 方法声明
  - 依赖: B12

- [x] **Task B14: 修改 AuthService 接口**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/AuthService.java`
  - 变更:
    - `register()` 返回值从 `LoginResponse` 改为 `RegisterResponse`
    - 新增 `AuditStatusVO getAuditStatus(String phone)` 方法
    - 新增 `RegisterResponse resubmit(ResubmitRequest req)` 方法
  - 依赖: B8, B9, B10

- [x] **Task B15: 修改 AuthServiceImpl，实现审核逻辑**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/AuthServiceImpl.java`
  - 变更:
    - `register()`: 创建用户时设置 `auditStatus=0`，返回 `RegisterResponse`（不生成 Token）
    - `loginByPassword()` / `loginBySms()`: 新增 `checkAuditStatus()` 校验方法
    - 新增 `checkAuditStatus(User user)`: auditStatus=0 抛出 USER_AUDIT_PENDING；auditStatus=2 抛出 USER_AUDIT_REJECTED（msg 拼接 auditRemark）
    - 新增 `getAuditStatus(String phone)`: 查用户，返回 AuditStatusVO（手机号脱敏）
    - 新增 `resubmit(ResubmitRequest req)`: 验证码校验 → 查用户 → 校验 auditStatus=2 → 更新密码/昵称/重置审核状态 → 返回 RegisterResponse
  - 依赖: B3, B4, B5, B8, B9, B10, B14

### 阶段五：Controller 层

- [x] **Task B16: 修改 AuthController，更新注册接口并新增审核状态查询和重新提交接口**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/controller/AuthController.java`
  - 变更:
    - `register()` 返回值从 `Result<LoginResponse>` 改为 `Result<RegisterResponse>`
    - 新增 `GET /audit-status` 接口（参数: phone）
    - 新增 `POST /resubmit` 接口
  - 依赖: B14, B15

- [x] **Task B17: 修改 AdminUserController，新增审核接口**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/user/controller/AdminUserController.java`
  - 变更: 新增 `POST /{id}/audit` 接口，调用 `UserService.audit()`
  - 依赖: B12, B13, B11

### 阶段六：配置

- [x] **Task B18: 修改 SaTokenConfigure，新增免登录白名单**
  - 文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`
  - 变更: App 拦截器 excludePathPatterns 新增 `/api/app/auth/audit-status` 和 `/api/app/auth/resubmit`
  - 依赖: B16

### 阶段七：验证

- [x] **Task B19: 后端编译验证**
  - 执行: `cd backend && ./gradlew compileJava`
  - 验证: 编译无错误
  - 依赖: B1-B18

---

## 前端任务 (Flutter)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：资源准备

- [x] **Task F1: 添加审核状态页背景图**
  - 文件: `native_app/assets/images/audit_bg.png`
  - 内容: 科研主题浅蓝渐变背景图（设计稿附件2）
  - 依赖: 无

### 阶段二：Model 层

- [x] **Task F2: 修改 UserModel，新增审核字段**
  - 文件: `native_app/lib/features/user/models/user_model.dart`
  - 变更: 新增 `auditStatus`（int?）、`auditRemark`（String?）、`auditTime`（String?）字段
  - 依赖: 无
  - 注意: 修改后必须执行 `flutter pub run build_runner build --delete-conflicting-outputs`

- [x] **Task F3: 修改 auth_models.dart，新增 RegisterResponse、AuditStatusResponse、ResubmitRequest**
  - 文件: `native_app/lib/features/auth/models/auth_models.dart`
  - 变更:
    - 新增 `RegisterResponse`（仅含 `user: UserModel`）
    - 新增 `AuditStatusResponse`（含 `auditStatus`、`auditRemark`、`nickname`、`phone`、`createTime`）
    - 新增 `ResubmitRequest`（含 `phone`、`password`、`code`、`nickname`）
  - 依赖: F2
  - 注意: 修改后必须执行 `flutter pub run build_runner build --delete-conflicting-outputs`

### 阶段三：DataSource 层

- [x] **Task F4: 修改 AuthRemoteDataSource**
  - 文件: `native_app/lib/features/auth/datasources/auth_remote_datasource.dart`
  - 变更:
    - `register()` 返回值不变（Map），但响应体结构变更（仅含 user，无 token）
    - 新增 `getAuditStatus(String phone)` 方法，调用 `GET /app/auth/audit-status?phone=xxx`
    - 新增 `resubmit(...)` 方法，调用 `POST /app/auth/resubmit`
  - 依赖: F3

### 阶段四：Repository 层

- [x] **Task F5: 修改 AuthRepository 接口**
  - 文件: `native_app/lib/features/auth/repositories/auth_repository.dart`
  - 变更:
    - `register()` 返回值从 `Future<LoginResponse>` 改为 `Future<RegisterResponse>`
    - 新增 `Future<AuditStatusResponse> getAuditStatus(String phone)` 方法
    - 新增 `Future<RegisterResponse> resubmit(...)` 方法
  - 依赖: F3

- [x] **Task F6: 修改 AuthRepositoryImpl**
  - 文件: `native_app/lib/features/auth/repositories/auth_repository_impl.dart`
  - 变更:
    - `register()`: 解析 `RegisterResponse`（仅含 user），**不保存 Token**
    - 新增 `getAuditStatus()`: 调用 datasource，返回 `AuditStatusResponse`
    - 新增 `resubmit()`: 调用 datasource，解析 `RegisterResponse`，**不保存 Token**
  - 依赖: F4, F5

### 阶段五：ViewModel 层

- [x] **Task F7: 修改 RegisterViewModel**
  - 文件: `native_app/lib/features/auth/view_model/register_view_model.dart`
  - 变更:
    - `register()` 返回值从 `Future<bool>` 改为 `Future<String?>`
    - 成功时返回手机号（String），失败时返回 null
    - 不再调用 `_handleLoginResponse` 保存 Token
  - 依赖: F6

- [x] **Task F8: 修改 LoginViewModel，新增 errorCode**
  - 文件: `native_app/lib/features/auth/view_model/login_view_model.dart`
  - 变更:
    - `LoginState` 新增 `errorCode`（int?）字段
    - `loginByPassword()` / `loginBySms()` 捕获 `ApiException` 时记录 `e.code` 到 `errorCode`
  - 依赖: 无

- [x] **Task F9: 创建 AccountReviewViewModel**
  - 文件: `native_app/lib/features/auth/view_model/account_review_view_model.dart`
  - 内容:
    - `AccountReviewState`（Freezed）: isLoading、auditStatus、auditRemark、nickname、phone、createTime、errorMessage
    - `AccountReviewViewModel`（Notifier）: `refresh(String phone)` 方法查询审核状态
  - 依赖: F6
  - 注意: 创建后必须执行 `flutter pub run build_runner build --delete-conflicting-outputs`

- [x] **Task F10: 创建 ResubmitViewModel**
  - 文件: `native_app/lib/features/auth/view_model/resubmit_view_model.dart`
  - 内容:
    - `ResubmitState`（Freezed）: isLoading、nickname、errorMessage
    - `ResubmitViewModel`（Notifier）:
      - `loadAuditInfo(String phone)` 方法：查询当前审核状态，预填昵称
      - `resubmit(...)` 方法：调用重新提交接口，返回 `String?`（成功返回 phone，失败返回 null）
  - 依赖: F6
  - 注意: 创建后必须执行 `flutter pub run build_runner build --delete-conflicting-outputs`

- [x] **Task F11: 修改 auth_provider.dart，新增 Provider**
  - 文件: `native_app/lib/features/auth/view_model/auth_provider.dart`
  - 变更: 新增 `accountReviewViewModelProvider` 和 `resubmitViewModelProvider`
  - 依赖: F9, F10

### 阶段六：页面视图

- [x] **Task F12: 修改 RegisterPage，注册成功后跳转审核页**
  - 文件: `native_app/lib/features/auth/view/register_page.dart`
  - 变更:
    - `_register()` 方法中，`register()` 返回值从 `bool` 改为 `String?`
    - 返回非 null（成功）时跳转 `/account-review?phone=xxx`
    - 返回 null（失败）时显示错误信息（逻辑不变）
  - 依赖: F7

- [x] **Task F13: 修改 LoginPage，处理审核错误码**
  - 文件: `native_app/lib/features/auth/view/login_page.dart`
  - 变更:
    - 监听 `LoginState.errorCode`，当为 10017（待审核）时，SnackBar 中增加「查看审核状态」按钮，点击跳转 `/account-review?phone=xxx`
    - 当为 10018（审核拒绝）时，SnackBar 中增加「查看审核状态」按钮，点击跳转 `/account-review?phone=xxx`
    - phone 参数取当前输入的手机号（根据 Tab 位置取 _phoneController 或 _smsPhoneController）
  - 依赖: F8

- [x] **Task F14: 创建 AccountReviewPage**
  - 文件: `native_app/lib/features/auth/view/account_review_page.dart`
  - 内容:
    - 接收 `phone` 参数
    - 使用 `assets/images/audit_bg.png` 作为全屏背景
    - 根据审核状态显示不同 UI（待审核 / 已通过 / 已驳回）
    - 待审核：蓝色时钟图标 + 信息卡片 + 「刷新状态」和「返回登录」按钮
    - 已通过：绿色对勾图标 + 信息卡片 + 「去登录」按钮
    - 已驳回：红色 × 图标 + 信息卡片（含驳回原因）+ 「修改信息重新提交」和「返回登录」按钮
    - 页面加载时自动查询一次审核状态
  - 依赖: F9, F11, F1

- [x] **Task F15: 创建 ResubmitPage**
  - 文件: `native_app/lib/features/auth/view/resubmit_page.dart`
  - 内容:
    - 接收 `phone` 参数
    - 表单：手机号（只读）、验证码、昵称（可编辑）、新密码、确认密码
    - 页面加载时查询当前信息，预填昵称
    - 点击「重新提交」调用 resubmit API
    - 成功后跳转回 `/account-review?phone=xxx`
  - 依赖: F10, F11

### 阶段七：路由配置

- [x] **Task F16: 修改 app_router.dart，注册新路由**
  - 文件: `native_app/lib/core/router/app_router.dart`
  - 变更:
    - `RoutePaths` 新增 `accountReview` 和 `resubmit` 路径常量
    - `_publicRoutes` 新增两个路由
    - `routes` 列表新增两个 GoRoute 定义（支持 query parameter `phone`）
  - 依赖: F14, F15

### 阶段八：验证

- [x] **Task F17: Flutter 代码生成与编译验证**
  - 执行: `cd native_app && flutter pub run build_runner build --delete-conflicting-outputs`
  - 执行: `cd native_app && flutter analyze`
  - 验证: 代码生成无错误，静态分析无错误
  - 依赖: F1-F16

---

## 管理端任务 (React Admin)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：类型定义

- [x] **Task A1: 修改 api.ts，新增审核相关类型**
  - 文件: `admin/src/types/api.ts`
  - 变更:
    - `AppUserInfo` 新增 `auditStatus`（number）、`auditRemark`（string | null）、`auditTime`（string | null）字段
    - 新增 `AuditUserRequest` 接口（`auditStatus: number`、`auditRemark?: string`）
  - 依赖: 无

### 阶段二：API 服务

- [x] **Task A2: 创建 appUser.ts API 服务**
  - 文件: `admin/src/services/api/appUser.ts`
  - 内容:
    - `page()`: 分页查询 App 用户，支持 `username` 和 `auditStatus` 筛选
    - `audit()`: 审核用户（`POST /api/admin/users/{id}/audit`）
  - 依赖: A1

### 阶段三：页面

- [x] **Task A3: 创建 AppUserPage.tsx**
  - 文件: `admin/src/pages/AppUserPage.tsx`
  - 内容:
    - 用户列表表格（手机号、用户名、昵称、审核状态 Badge、注册时间、操作）
    - 筛选区（用户名搜索 + 审核状态 Select）
    - 待审核用户行显示「通过」和「拒绝」按钮
    - 「通过」直接调用审核 API
    - 「拒绝」弹出对话框填写驳回原因
    - 审核成功后刷新列表
    - 分页支持
  - 依赖: A2

### 阶段四：路由配置

- [x] **Task A4: 修改 router.tsx，注册 App 用户管理路由**
  - 文件: `admin/src/app/router.tsx`
  - 变更:
    - 导入 `AppUserPage`
    - 新增 `appUserRoute`（path: `/app-users`）
    - 路由树 `adminRoute.addChildren` 中添加 `appUserRoute`
  - 依赖: A3

### 阶段五：菜单配置

- [x] **Task A5: 新增 App 用户管理菜单项**
  - 文件: `backend/src/main/resources/sql/menu_migration.sql`
  - 变更: 新增菜单记录（名称: App 用户管理，路径: /app-users，图标: users）
  - 依赖: A4
  - 参考: 现有菜单结构

### 阶段六：验证

- [x] **Task A6: 管理端编译验证**
  - 执行: `cd admin && pnpm build`
  - 验证: 编译无错误
  - 依赖: A1-A5
