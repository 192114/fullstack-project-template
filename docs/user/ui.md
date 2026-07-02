# 用户体系 - UI 文档

## 页面列表

| 页面 | 路由 | 描述 |
|------|------|------|
| LoginPage | /login | 登录页（密码登录 + 验证码登录双 Tab） |
| RegisterPage | /register | 注册页（手机号 + 密码 + 验证码） |
| ResetPasswordPage | /reset-password | 重置密码页（免登录，手机号 + 验证码 + 新密码） |
| ProfilePage | /profile | 个人资料页（查看 + 编辑） |
| ChangePasswordPage | /profile/change-password | 修改密码页（需登录） |

## 前端目录结构

```
lib/features/auth/
├── models/
│   └── auth_models.dart          # 登录响应、请求体等 Freezed 模型
├── datasources/
│   └── auth_datasource.dart      # 认证相关 API 调用
├── repositories/
│   └── auth_repository.dart      # 认证仓库（接口 + 实现 + Provider）
├── view_model/
│   ├── login_view_model.dart     # 登录状态管理
│   ├── register_view_model.dart  # 注册状态管理
│   ├── reset_password_view_model.dart  # 重置密码状态管理
│   └── auth_provider.dart        # Riverpod Providers 集中定义
└── view/
    ├── login_page.dart            # 登录页
    ├── register_page.dart        # 注册页
    └── reset_password_page.dart   # 重置密码页

lib/features/user/
├── models/
│   └── user_model.dart            # 用户信息 Freezed 模型
├── datasources/
│   └── user_datasource.dart       # 用户相关 API 调用
├── repositories/
│   └── user_repository.dart       # 用户仓库（接口 + 实现 + Provider）
├── view_model/
│   ├── profile_view_model.dart    # 个人资料状态管理
│   ├── change_password_view_model.dart  # 修改密码状态管理
│   └── user_provider.dart        # Riverpod Providers 集中定义
└── view/
    ├── profile_page.dart          # 个人资料页
    └── change_password_page.dart  # 修改密码页

lib/widgets/
└── sms_code_input.dart            # 可复用的验证码输入组件（手机号 + 发送按钮 + 验证码输入）
```

## 页面详情

### 1. 登录页（LoginPage）

- **路由**: `/login`
- **类型**: 全屏页面

**布局结构:**
```
Scaffold
├── AppBar(title: '登录')
├── Body
│   ├── TabBar (密码登录 | 验证码登录)
│   └── TabBarView
│       ├── [Tab 1] 密码登录表单
│       │   ├── TextField (手机号)
│       │   ├── TextField (密码, obscureText: true)
│       │   ├── Row
│       │   │   ├── Spacer()
│       │   │   └── TextButton('忘记密码？' → /reset-password)
│       │   ├── ElevatedButton('登录')
│       │   └── Row('还没账号？' TextButton('去注册' → /register))
│       └── [Tab 2] 验证码登录表单
│           ├── TextField (手机号)
│           ├── SmsCodeInput (手机号 + 验证码 + 发送按钮)
│           ├── ElevatedButton('登录')
│           └── Row('还没账号？' TextButton('去注册' → /register))
```

**交互逻辑:**
- 表单验证: 手机号 11 位且以 1 开头；密码至少 6 位
- 加载状态: 按钮显示 Loading，禁用重复点击
- 错误提示: 使用 SnackBar 展示错误信息
- 成功反馈: 登录成功后跳转到首页 `/home`，TokenManager 自动保存双 Token
- 验证码发送: 倒计时 60 秒，期间按钮禁用并显示剩余秒数
- 场景参数: 验证码发送时 scene = `LOGIN`

**状态管理:**
- ViewModel: `LoginViewModel` (Notifier)
- 状态类型: `LoginState` (Freezed)
  ```dart
  @freezed
  class LoginState with _$LoginState {
    const factory LoginState({
      @Default(false) bool isLoading,
      @Default(60) int smsCountdown,
      @Default(false) bool isSmsSending,
    }) = _LoginState;
  }
  ```

**API 调用:**
- 密码登录: `POST /api/auth/login/password`
- 验证码登录: `POST /api/auth/login/sms`
- 发送验证码: `POST /api/auth/send-code` (scene=LOGIN)

---

### 2. 注册页（RegisterPage）

- **路由**: `/register`
- **类型**: 全屏页面

**布局结构:**
```
Scaffold
├── AppBar(title: '注册')
├── Body (SingleChildScrollView)
│   ├── TextField (手机号)
│   ├── SmsCodeInput (手机号 + 验证码 + 发送按钮, scene=REGISTER)
│   ├── TextField (密码, obscureText: true)
│   ├── TextField (确认密码, obscureText: true)
│   ├── TextField (昵称, 选填)
│   ├── ElevatedButton('注册')
│   └── Row('已有账号？' TextButton('去登录' → /login))
```

**交互逻辑:**
- 表单验证: 手机号格式校验；密码 ≥ 6 位；两次密码一致；昵称选填
- 加载状态: 按钮显示 Loading
- 错误提示: SnackBar
- 成功反馈: 注册成功后自动登录，保存 Token，跳转首页
- 验证码发送: scene = `REGISTER`，倒计时 60 秒

**状态管理:**
- ViewModel: `RegisterViewModel` (Notifier)
- 状态类型: `RegisterState` (Freezed)
  ```dart
  @freezed
  class RegisterState with _$RegisterState {
    const factory RegisterState({
      @Default(false) bool isLoading,
      @Default(60) int smsCountdown,
      @Default(false) bool isSmsSending,
    }) = _RegisterState;
  }
  ```

**API 调用:**
- 发送验证码: `POST /api/auth/send-code` (scene=REGISTER)
- 注册: `POST /api/auth/register`

---

### 3. 重置密码页（ResetPasswordPage）

- **路由**: `/reset-password`
- **类型**: 全屏页面

**布局结构:**
```
Scaffold
├── AppBar(title: '重置密码')
├── Body (SingleChildScrollView)
│   ├── TextField (手机号)
│   ├── SmsCodeInput (手机号 + 验证码 + 发送按钮, scene=RESET_PASSWORD)
│   ├── TextField (新密码, obscureText: true)
│   ├── TextField (确认新密码, obscureText: true)
│   ├── ElevatedButton('确认重置')
│   └── TextButton('返回登录' → /login)
```

**交互逻辑:**
- 表单验证: 手机号格式校验；新密码 ≥ 6 位；两次密码一致
- 加载状态: 按钮显示 Loading
- 错误提示: SnackBar
- 成功反馈: SnackBar 提示「密码重置成功」，跳转回登录页
- 验证码发送: scene = `RESET_PASSWORD`，倒计时 60 秒

**状态管理:**
- ViewModel: `ResetPasswordViewModel` (Notifier)
- 状态类型: `ResetPasswordState` (Freezed)

**API 调用:**
- 发送验证码: `POST /api/auth/send-code` (scene=RESET_PASSWORD)
- 重置密码: `POST /api/auth/reset-password`

---

### 4. 个人资料页（ProfilePage）

- **路由**: `/profile`
- **类型**: 全屏页面

**布局结构:**
```
Scaffold
├── AppBar(title: '个人资料', actions: [编辑按钮])
├── Body
│   ├── 头像区域 (CircleAvatar + 可点击更换)
│   ├── ListTile (手机号, 不可编辑, trailing: Text(masked phone))
│   ├── ListTile (用户名, 不可编辑)
│   ├── ListTile (昵称, 可编辑 → 弹出编辑对话框)
│   ├── ListTile (邮箱, 可编辑 → 弹出编辑对话框)
│   ├── Divider
│   ├── ListTile('修改密码' → /profile/change-password, trailing: Icon)
│   └── ListTile('退出登录', textColor: red, onTap: 弹出确认对话框)
```

**交互逻辑:**
- 页面加载时调用 `GET /api/auth/me` 获取用户信息
- 编辑模式: 点击编辑按钮切换为可编辑状态，或点击各字段弹出编辑对话框
- 手机号脱敏显示: 中间 4 位用 `****` 替代（如 `138****0000`）
- 头像更换: 点击头像弹出底部弹窗（拍照 / 相册），暂不实现上传，预留接口
- 退出登录: 弹出确认对话框 → 调用 `POST /api/auth/logout` → 清除 Token → 跳转登录页
- 加载状态: 显示 Loading indicator
- 错误提示: SnackBar

**状态管理:**
- ViewModel: `ProfileViewModel` (AsyncNotifier)
- 状态类型: `ProfileState` (Freezed)
  ```dart
  @freezed
  class ProfileState with _$ProfileState {
    const factory ProfileState({
      User? user,
      @Default(false) bool isEditing,
      @Default(false) bool isSaving,
    }) = _ProfileState;
  }
  ```

**API 调用:**
- 获取用户信息: `GET /api/auth/me`
- 更新资料: `PUT /api/users/profile`
- 退出登录: `POST /api/auth/logout`

---

### 5. 修改密码页（ChangePasswordPage）

- **路由**: `/profile/change-password`
- **类型**: 全屏页面

**布局结构:**
```
Scaffold
├── AppBar(title: '修改密码')
├── Body (SingleChildScrollView)
│   ├── TextField (原密码, obscureText: true)
│   ├── TextField (新密码, obscureText: true)
│   ├── TextField (确认新密码, obscureText: true)
│   └── ElevatedButton('确认修改')
```

**交互逻辑:**
- 表单验证: 原密码不为空；新密码 ≥ 6 位；两次密码一致；新旧密码不同
- 加载状态: 按钮显示 Loading
- 错误提示: SnackBar（原密码错误等）
- 成功反馈: SnackBar 提示「密码修改成功」，返回个人资料页

**状态管理:**
- ViewModel: `ChangePasswordViewModel` (Notifier)
- 状态类型: `ChangePasswordState` (Freezed)

**API 调用:**
- 修改密码: `PUT /api/users/password`

---

## 可复用组件

### SmsCodeInput（验证码输入组件）

- **文件**: `lib/widgets/sms_code_input.dart`

**布局结构:**
```
Row
├── Expanded (TextField, 验证码输入框, keyboardType: number)
└── SizedBox(width: 12)
└── TextButton / OutlinedButton (发送验证码 / 倒计时)
```

**功能:**
- 接收手机号和场景参数
- 点击发送按钮调用 `POST /api/auth/send-code`
- 发送后开始 60 秒倒计时，期间按钮显示「Xs 后重发」并禁用
- 倒计时结束后恢复为「获取验证码」
- 手机号为空或格式错误时，按钮禁用

**参数:**
```dart
class SmsCodeInput extends StatefulWidget {
  final String phone;           // 手机号
  final String scene;            // 场景: LOGIN / REGISTER / RESET_PASSWORD
  final ValueChanged<String> onCodeChanged;  // 验证码变化回调
  final String? Function()? onError;  // 错误回调
}
```

---

## 路由更新

> 对应文件: `native_app/lib/core/router/app_router.dart`

**新增路由路径:**
```dart
static const String register = '/register';
static const String resetPassword = '/reset-password';
static const String profile = '/profile';
static const String changePassword = '/profile/change-password';
```

**免登录白名单更新:**
```dart
const _publicRoutes = {
  RoutePaths.login,
  RoutePaths.welcome,
  RoutePaths.register,       // 新增
  RoutePaths.resetPassword,   // 新增
};
```

---

## 前端网络层更新

> 对应文件: `native_app/lib/core/network/api_interceptor.dart`

**Token 刷新逻辑更新:**
- 当前 `_refreshToken()` 方法直接读取 `response.data['accessToken']`，需改为读取 `response.data['data']['accessToken']`（适配 `Result<T>` 包装格式）
- 刷新成功后保存新的双 Token
- 刷新失败后清除 Token 并跳转登录页

**关键变更点:**
```dart
// 旧:
final newAccessToken = response.data['accessToken'] as String?;
final newRefreshToken = response.data['refreshToken'] as String?;

// 新:
final data = response.data['data'] as Map<String, dynamic>?;
final newAccessToken = data?['accessToken'] as String?;
final newRefreshToken = data?['refreshToken'] as String?;
```

---

## 前端 Provider 设计

### Auth Providers

> 对应文件: `native_app/lib/features/auth/view_model/auth_provider.dart`

```dart
// DataSource Provider
final authDatasourceProvider = Provider<AuthDatasource>((ref) {
  return AuthDatasource(dioClient);
});

// Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.read(authDatasourceProvider));
});

// ViewModel Providers
final loginViewModelProvider = NotifierProvider<LoginViewModel, LoginState>(
  LoginViewModel.new,
);
final registerViewModelProvider = NotifierProvider<RegisterViewModel, RegisterState>(
  RegisterViewModel.new,
);
final resetPasswordViewModelProvider = NotifierProvider<ResetPasswordViewModel, ResetPasswordState>(
  ResetPasswordViewModel.new,
);
```

### User Providers

> 对应文件: `native_app/lib/features/user/view_model/user_provider.dart`

```dart
// DataSource Provider
final userDatasourceProvider = Provider<UserDatasource>((ref) {
  return UserDatasource(dioClient);
});

// Repository Provider
final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepositoryImpl(ref.read(userDatasourceProvider));
});

// ViewModel Providers
final profileViewModelProvider = AsyncNotifierProvider<ProfileViewModel, ProfileState>(
  ProfileViewModel.new,
);
final changePasswordViewModelProvider = NotifierProvider<ChangePasswordViewModel, ChangePasswordState>(
  ChangePasswordViewModel.new,
);
```
