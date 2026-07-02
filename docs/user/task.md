# 用户体系 - 执行任务清单

## 后端任务 (Spring Boot)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：数据层

- [ ] **Task B1: 修改 User 实体**
  - 文件: `backend/src/main/java/com/shadow/backend/user/entity/User.java`
  - 变更: 新增 `phone`（String）、`avatar`（String）字段；`@TableName` 从 `sys_user` 改为 `app_user`
  - 依赖: 无
  - 参考: domain.md 中的 User 实体定义

- [ ] **Task B2: 创建 SmsLog 实体**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/entity/SmsLog.java`
  - 内容: 短信验证码日志实体，包含 phone、scene、code、status、sendTime、verifiedTime 等字段
  - 依赖: 无
  - 参考: domain.md 中的 SmsLog 实体定义

- [ ] **Task B3: 创建 SmsLogMapper**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/mapper/SmsLogMapper.java`
  - 内容: 继承 `BaseMapper<SmsLog>`
  - 依赖: B2

- [ ] **Task B4: 更新数据库 Schema**
  - 文件: `backend/src/main/resources/sql/schema.sql`
  - 变更:
    - app_user 表: 将 `sys_user` 重命名为 `app_user`，新增 `phone`（VARCHAR(20) NOT NULL UNIQUE）、`avatar`（VARCHAR(255)）字段，修改 `username` 为可空
    - 新增 app_sms_log 表
  - 依赖: B1, B2

### 阶段二：常量与错误码

- [ ] **Task B5: 创建 SmsScene 枚举**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/constant/SmsScene.java`
  - 内容: 枚举值 LOGIN / REGISTER / RESET_PASSWORD，含 `fromName(String)` 静态方法
  - 依赖: 无
  - 参考: domain.md 中的 SmsScene 枚举定义

- [ ] **Task B6: 创建 AuthResultCode 枚举**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/response/AuthResultCode.java`
  - 内容: 实现 IResultCode 接口，包含 10010-10016 错误码
  - 依赖: 无
  - 参考: domain.md 中的 AuthResultCode 枚举定义

- [ ] **Task B7: 修改 UserResultCode 枚举**
  - 文件: `backend/src/main/java/com/shadow/backend/user/response/UserResultCode.java`
  - 变更: 修改 LOGIN_FAILED 描述为「手机号或密码错误」；新增 OLD_PASSWORD_INCORRECT(10005)
  - 依赖: 无
  - 参考: domain.md 中的 UserResultCode 枚举定义

### 阶段三：DTO 与 VO

- [ ] **Task B8: 创建 Auth DTO**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/dto/SendCodeRequest.java` — phone, scene
    - `backend/src/main/java/com/shadow/backend/auth/dto/PasswordLoginRequest.java` — phone, password
    - `backend/src/main/java/com/shadow/backend/auth/dto/SmsLoginRequest.java` — phone, code
    - `backend/src/main/java/com/shadow/backend/auth/dto/RegisterRequest.java` — phone, password, code, nickname
    - `backend/src/main/java/com/shadow/backend/auth/dto/RefreshTokenRequest.java` — refreshToken
    - `backend/src/main/java/com/shadow/backend/auth/dto/ResetPasswordRequest.java` — phone, newPassword, code
  - 依赖: 无
  - 参考: api.md 中各接口的请求参数

- [ ] **Task B9: 修改 Auth VO**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/dto/LoginResponse.java` — 修改为 accessToken, refreshToken, user
    - `backend/src/main/java/com/shadow/backend/auth/vo/RefreshTokenResponse.java` — 新增，包含 accessToken, refreshToken
  - 依赖: 无
  - 参考: api.md 中登录和刷新接口的响应格式

- [ ] **Task B10: 修改 User DTO/VO**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/user/vo/UserVO.java` — 新增 phone, avatar 字段
    - `backend/src/main/java/com/shadow/backend/user/dto/UpdateProfileRequest.java` — 新增，包含 nickname, email, avatar
    - `backend/src/main/java/com/shadow/backend/user/dto/ChangePasswordRequest.java` — 新增，包含 oldPassword, newPassword
    - `backend/src/main/java/com/shadow/backend/user/dto/CreateUserRequest.java` — 新增 phone 字段（保持兼容）
  - 依赖: 无

### 阶段四：Service 层

- [ ] **Task B11: 创建 SmsService（接口 + 实现）**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/service/SmsService.java`
    - `backend/src/main/java/com/shadow/backend/auth/service/impl/SmsServiceImpl.java`
  - 功能:
    - `void sendCode(String phone, SmsScene scene)` — 生成 6 位验证码，存入 Redis（key: `sms:code:{scene}:{phone}`, TTL 5min），频率限制（key: `sms:limit:{phone}`, TTL 60s），记录 SmsLog，调用 SmsSender 发送
    - `void verifyCode(String phone, SmsScene scene, String code)` — 从 Redis 读取验证码比对，验证后删除，更新 SmsLog 状态
  - 依赖: B2, B3, B5, B6
  - 参考: domain.md 中 Redis 数据结构

- [ ] **Task B12: 创建 SmsSender 接口 + 日志实现**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/service/SmsSender.java` — 接口: `void send(String phone, String code)`
    - `backend/src/main/java/com/shadow/backend/auth/service/impl/LogSmsSender.java` — 实现接口，仅日志输出验证码（开发环境用）
  - 依赖: 无

- [ ] **Task B13: 创建 TokenService（接口 + 实现）**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/service/TokenService.java`
    - `backend/src/main/java/com/shadow/backend/auth/service/impl/TokenServiceImpl.java`
  - 功能:
    - `TokenPair createTokens(Long userId)` — 调用 `StpUtil.login(userId)` 获取 Access Token，生成 UUID Refresh Token，存入 Redis（key: `auth:refresh:{token}`, value: userId, TTL 7d），返回 TokenPair
    - `TokenPair refreshToken(String refreshToken)` — 从 Redis 读取 userId，删除旧 Token，调用 createTokens 生成新 Token 对
    - `void removeTokens(String refreshToken)` — 从 Redis 删除 Refresh Token，调用 `StpUtil.logout()`
  - 依赖: 无（使用 Sa-Token + Redis，已有依赖）
  - 参考: domain.md 中 Redis 数据结构

- [ ] **Task B14: 重构 AuthService（接口 + 实现）**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/auth/service/AuthService.java`
    - `backend/src/main/java/com/shadow/backend/auth/service/impl/AuthServiceImpl.java`
  - 功能:
    - `LoginResponse loginByPassword(PasswordLoginRequest req)` — 按手机号查用户，验证密码，检查状态，创建双 Token
    - `LoginResponse loginBySms(SmsLoginRequest req)` — 验证验证码，按手机号查用户，检查状态，创建双 Token
    - `LoginResponse register(RegisterRequest req)` — 验证验证码，检查手机号是否已注册，创建用户（密码 Argon2 加密），创建双 Token
    - `RefreshTokenResponse refresh(RefreshTokenRequest req)` — 调用 TokenService 刷新 Token
    - `void logout()` — 获取当前 Refresh Token（从请求或 Sa-Token Session），调用 TokenService 移除
    - `UserVO getCurrentUser()` — 从 LoginUserUtil 获取 userId，调用 UserService.getById
    - `void resetPassword(ResetPasswordRequest req)` — 验证验证码，按手机号查用户，更新密码
  - 依赖: B8, B9, B11, B13, B15

- [ ] **Task B15: 修改 UserService（接口 + 实现）**
  - 文件:
    - `backend/src/main/java/com/shadow/backend/user/service/UserService.java`
    - `backend/src/main/java/com/shadow/backend/user/service/impl/UserServiceImpl.java`
  - 变更:
    - 新增 `UserVO updateProfile(Long userId, UpdateProfileRequest req)` — 更新昵称、邮箱、头像
    - 新增 `void changePassword(Long userId, ChangePasswordRequest req)` — 验证原密码，更新新密码
    - 新增 `User getByPhone(String phone)` — 按手机号查询用户实体
    - 修改 `toVO()` — 映射 phone, avatar 字段
    - 修改 `create()` — 支持 phone 字段
  - 依赖: B1, B10

### 阶段五：Controller 层

- [ ] **Task B16: 重构 AuthController**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/controller/AuthController.java`
  - 变更:
    - 移除旧 `/login` 端点
    - 新增 `POST /api/auth/send-code` — 调用 SmsService.sendCode
    - 新增 `POST /api/auth/login/password` — 调用 AuthService.loginByPassword
    - 新增 `POST /api/auth/login/sms` — 调用 AuthService.loginBySms
    - 修改 `POST /api/auth/register` — 调用 AuthService.register
    - 新增 `POST /api/auth/refresh` — 调用 AuthService.refresh
    - 修改 `POST /api/auth/logout` — 调用 AuthService.logout
    - 新增 `GET /api/auth/me` — 调用 AuthService.getCurrentUser
    - 新增 `POST /api/auth/reset-password` — 调用 AuthService.resetPassword
  - 依赖: B14

- [ ] **Task B17: 扩展 UserController**
  - 文件: `backend/src/main/java/com/shadow/backend/user/controller/UserController.java`
  - 变更:
    - 新增 `PUT /api/users/profile` — 调用 UserService.updateProfile（需登录）
    - 新增 `PUT /api/users/password` — 调用 UserService.changePassword（需登录）
  - 依赖: B15

### 阶段六：配置更新

- [ ] **Task B18: 更新 SaTokenConfigure 免登录白名单**
  - 文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`
  - 变更: excludePathPatterns 更新为:
    - `/api/auth/login/password`
    - `/api/auth/login/sms`
    - `/api/auth/register`
    - `/api/auth/refresh`
    - `/api/auth/send-code`
    - `/api/auth/reset-password`
    - `/swagger-ui/**`
    - `/swagger-ui.html`
    - `/v3/api-docs/**`
  - 依赖: 无

- [ ] **Task B19: 更新 application.yaml Sa-Token 配置**
  - 文件: `backend/src/main/resources/application.yaml`
  - 变更: `sa-token.timeout` 从 `86400` 改为 `7200`（2 小时）
  - 依赖: 无

---

## 前端任务 (Flutter)

按以下顺序执行，每个任务完成后标记为 [x]：

### 阶段一：模型与网络层

- [ ] **Task F1: 创建 Auth 模型（Freezed）**
  - 文件: `native_app/lib/features/auth/models/auth_models.dart`
  - 内容: 使用 Freezed + JsonSerializable 定义:
    - `LoginResponse` — accessToken, refreshToken, user (UserModel)
    - `RefreshTokenResponse` — accessToken, refreshToken
    - `SendCodeRequest` — phone, scene
    - `PasswordLoginRequest` — phone, password
    - `SmsLoginRequest` — phone, code
    - `RegisterRequest` — phone, password, code, nickname
    - `RefreshTokenRequest` — refreshToken
    - `ResetPasswordRequest` — phone, newPassword, code
  - 依赖: 无
  - 注意: 创建后必须执行 `dart run build_runner build --delete-conflicting-outputs`

- [ ] **Task F2: 创建 User 模型（Freezed）**
  - 文件: `native_app/lib/features/user/models/user_model.dart`
  - 内容: 使用 Freezed + JsonSerializable 定义:
    - `UserModel` — id, phone, username, nickname, avatar, email, status, createTime, updateTime
    - `UpdateProfileRequest` — nickname, email, avatar
    - `ChangePasswordRequest` — oldPassword, newPassword
  - 依赖: 无
  - 注意: 创建后必须执行 `dart run build_runner build --delete-conflicting-outputs`

- [ ] **Task F3: 更新 ApiInterceptor Token 刷新逻辑**
  - 文件: `native_app/lib/core/network/api_interceptor.dart`
  - 变更: `_refreshToken()` 方法中修改响应解析逻辑:
    - 从 `response.data['accessToken']` 改为 `response.data['data']['accessToken']`（适配 `Result<T>` 包装格式）
    - 同理 `refreshToken` 字段
  - 依赖: 无
  - 参考: ui.md 中前端网络层更新

### 阶段二：数据源与仓库

- [ ] **Task F4: 创建 Auth DataSource**
  - 文件: `native_app/lib/features/auth/datasources/auth_datasource.dart`
  - 内容: 封装所有认证相关 API 调用:
    - `sendCode(phone, scene)` → POST /api/auth/send-code
    - `loginByPassword(phone, password)` → POST /api/auth/login/password
    - `loginBySms(phone, code)` → POST /api/auth/login/sms
    - `register(phone, password, code, nickname?)` → POST /api/auth/register
    - `refreshToken(refreshToken)` → POST /api/auth/refresh
    - `logout()` → POST /api/auth/logout
    - `getCurrentUser()` → GET /api/auth/me
    - `resetPassword(phone, newPassword, code)` → POST /api/auth/reset-password
  - 依赖: F1

- [ ] **Task F5: 创建 Auth Repository**
  - 文件: `native_app/lib/features/auth/repositories/auth_repository.dart`
  - 内容: 抽象接口 `AuthRepository` + 实现 `AuthRepositoryImpl`
    - 接口方法对应 DataSource 所有方法
    - 实现中调用 DataSource，解析 `Result<T>` 格式响应，返回业务数据或抛出 ApiException
    - 登录/注册成功后调用 `TokenManager.saveTokens()` 保存双 Token
    - 退出登录后调用 `TokenManager.clearTokens()` 清除 Token
  - 依赖: F4

- [ ] **Task F6: 创建 User DataSource**
  - 文件: `native_app/lib/features/user/datasources/user_datasource.dart`
  - 内容: 封装用户相关 API 调用:
    - `updateProfile(nickname?, email?, avatar?)` → PUT /api/users/profile
    - `changePassword(oldPassword, newPassword)` → PUT /api/users/password
  - 依赖: F2

- [ ] **Task F7: 创建 User Repository**
  - 文件: `native_app/lib/features/user/repositories/user_repository.dart`
  - 内容: 抽象接口 `UserRepository` + 实现 `UserRepositoryImpl`
    - `updateProfile(UpdateProfileRequest)` → 返回 UserModel
    - `changePassword(ChangePasswordRequest)` → 返回 void
  - 依赖: F6

### 阶段三：状态管理

- [ ] **Task F8: 创建 Auth Providers**
  - 文件: `native_app/lib/features/auth/view_model/auth_provider.dart`
  - 内容: Riverpod Provider 集中定义:
    - `authDatasourceProvider` — Provider<AuthDatasource>
    - `authRepositoryProvider` — Provider<AuthRepository>
    - `loginViewModelProvider` — NotifierProvider<LoginViewModel, LoginState>
    - `registerViewModelProvider` — NotifierProvider<RegisterViewModel, RegisterState>
    - `resetPasswordViewModelProvider` — NotifierProvider<ResetPasswordViewModel, ResetPasswordState>
  - 依赖: F5

- [ ] **Task F9: 创建 LoginViewModel**
  - 文件: `native_app/lib/features/auth/view_model/login_view_model.dart`
  - 内容: LoginState (Freezed) + LoginViewModel (Notifier):
    - `loginByPassword(phone, password)` — 调用 Repository，成功后更新登录状态
    - `loginBySms(phone, code)` — 调用 Repository，成功后更新登录状态
    - `sendSmsCode(phone)` — 调用 Repository 发送验证码，启动倒计时
    - 倒计时定时器管理（60 秒）
  - 依赖: F8

- [ ] **Task F10: 创建 RegisterViewModel**
  - 文件: `native_app/lib/features/auth/view_model/register_view_model.dart`
  - 内容: RegisterState (Freezed) + RegisterViewModel (Notifier):
    - `register(phone, password, code, nickname?)` — 调用 Repository，成功后更新登录状态
    - `sendSmsCode(phone)` — 调用 Repository 发送验证码，启动倒计时
  - 依赖: F8

- [ ] **Task F11: 创建 ResetPasswordViewModel**
  - 文件: `native_app/lib/features/auth/view_model/reset_password_view_model.dart`
  - 内容: ResetPasswordState (Freezed) + ResetPasswordViewModel (Notifier):
    - `resetPassword(phone, newPassword, code)` — 调用 Repository
    - `sendSmsCode(phone)` — 调用 Repository 发送验证码，启动倒计时
  - 依赖: F8

- [ ] **Task F12: 创建 User Providers**
  - 文件: `native_app/lib/features/user/view_model/user_provider.dart`
  - 内容: Riverpod Provider 集中定义:
    - `userDatasourceProvider` — Provider<UserDatasource>
    - `userRepositoryProvider` — Provider<UserRepository>
    - `profileViewModelProvider` — AsyncNotifierProvider<ProfileViewModel, ProfileState>
    - `changePasswordViewModelProvider` — NotifierProvider<ChangePasswordViewModel, ChangePasswordState>
  - 依赖: F7

- [ ] **Task F13: 创建 ProfileViewModel**
  - 文件: `native_app/lib/features/user/view_model/profile_view_model.dart`
  - 内容: ProfileState (Freezed) + ProfileViewModel (AsyncNotifier):
    - `build()` — 初始化时调用 `GET /api/auth/me` 获取用户信息
    - `updateProfile(UpdateProfileRequest)` — 调用 Repository 更新资料
    - `logout()` — 调用 Repository 退出登录，清除状态
  - 依赖: F12

- [ ] **Task F14: 创建 ChangePasswordViewModel**
  - 文件: `native_app/lib/features/user/view_model/change_password_view_model.dart`
  - 内容: ChangePasswordState (Freezed) + ChangePasswordViewModel (Notifier):
    - `changePassword(oldPassword, newPassword)` — 调用 Repository
  - 依赖: F12

### 阶段四：可复用组件

- [ ] **Task F15: 创建 SmsCodeInput 组件**
  - 文件: `native_app/lib/widgets/sms_code_input.dart`
  - 内容: StatefulWidget，包含:
    - 手机号输入（外部传入或内部 TextField）
    - 验证码输入 TextField（keyboardType: number, maxLength: 6）
    - 发送验证码按钮（60 秒倒计时，防重复点击）
    - 调用 authRepositoryProvider 发送验证码
    - onCodeChanged 回调
  - 依赖: F8

### 阶段五：页面视图

- [ ] **Task F16: 创建 LoginPage**
  - 文件: `native_app/lib/features/auth/view/login_page.dart`
  - 内容: 双 Tab 布局（密码登录 + 验证码登录），使用 SmsCodeInput 组件
  - 依赖: F9, F15

- [ ] **Task F17: 创建 RegisterPage**
  - 文件: `native_app/lib/features/auth/view/register_page.dart`
  - 内容: 注册表单（手机号 + 验证码 + 密码 + 确认密码 + 昵称），使用 SmsCodeInput 组件
  - 依赖: F10, F15

- [ ] **Task F18: 创建 ResetPasswordPage**
  - 文件: `native_app/lib/features/auth/view/reset_password_page.dart`
  - 内容: 重置密码表单（手机号 + 验证码 + 新密码 + 确认新密码），使用 SmsCodeInput 组件
  - 依赖: F11, F15

- [ ] **Task F19: 创建 ProfilePage**
  - 文件: `native_app/lib/features/user/view/profile_page.dart`
  - 内容: 个人资料展示与编辑，退出登录入口
  - 依赖: F13

- [ ] **Task F20: 创建 ChangePasswordPage**
  - 文件: `native_app/lib/features/user/view/change_password_page.dart`
  - 内容: 修改密码表单（原密码 + 新密码 + 确认新密码）
  - 依赖: F14

### 阶段六：路由注册

- [ ] **Task F21: 更新路由配置**
  - 文件: `native_app/lib/core/router/app_router.dart`
  - 变更:
    - 新增路由路径: `/register`, `/reset-password`, `/profile`, `/profile/change-password`
    - 更新免登录白名单 `_publicRoutes`: 添加 `/register`, `/reset-password`
    - 新增 GoRoute 定义，替换占位 LoginPage 为真实 LoginPage
    - 替换占位 HomePage 为真实 ProfilePage 入口（或保留 Home，在 Home 中添加跳转 Profile 的入口）
  - 依赖: F16, F17, F18, F19, F20

### 阶段七：Provider 注册

- [ ] **Task F22: 更新 ProviderScope 配置**
  - 文件: `native_app/lib/main.dart`
  - 变更: 确认 ProviderScope 包裹整个 App（Riverpod 3.x 默认全局可用，确认无需额外配置）
  - 依赖: F8, F12
