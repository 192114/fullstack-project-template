# 用户注册审核 - UI 文档

## 设计稿参考

- **审核状态页设计稿**: 展示「审核中」和「审核驳回」两种状态，含申请信息卡片
- **背景图片**: 科研主题浅蓝渐变背景，含 DNA 双螺旋、分子结构、实验器皿等装饰元素
- **背景图存放路径**: `native_app/assets/images/audit_bg.png`

## 页面列表

### App 端（Flutter）

| 页面 | 路由 | 描述 | 变更类型 |
|------|------|------|----------|
| AccountReviewPage | /account-review | 账号审核状态页（注册成功后跳转） | **新增** |
| ResubmitPage | /resubmit | 驳回后修改信息重新提交页 | **新增** |
| RegisterPage | /register | 注册页 | **修改**（注册成功后跳转审核页） |
| LoginPage | /login | 登录页 | **修改**（处理审核状态错误码） |

### 管理端（React）

| 页面 | 路由 | 描述 | 变更类型 |
|------|------|------|----------|
| AppUserPage | /app-users | App 用户管理页（含审核功能） | **新增** |

---

## App 端目录结构变更

```
native_app/lib/features/auth/
├── models/
│   └── auth_models.dart              # 修改：新增 RegisterResponse、AuditStatusResponse、ResubmitRequest
├── datasources/
│   └── auth_remote_datasource.dart   # 修改：register 返回 RegisterResponse；新增 getAuditStatus、resubmit
├── repositories/
│   └── auth_repository_impl.dart     # 修改：register 不再保存 Token；新增 getAuditStatus、resubmit
├── view_model/
│   ├── register_view_model.dart      # 修改：register 返回 String?（手机号）而非 bool
│   ├── login_view_model.dart         # 修改：新增 errorCode 字段，处理审核错误码
│   ├── account_review_view_model.dart # 新增：审核状态管理
│   ├── resubmit_view_model.dart      # 新增：重新提交管理
│   └── auth_provider.dart            # 修改：新增 AccountReviewViewModel、ResubmitViewModel Provider
└── view/
    ├── register_page.dart            # 修改：注册成功后跳转审核页
    ├── login_page.dart               # 修改：处理审核错误码，SnackBar 增加跳转按钮
    ├── account_review_page.dart      # 新增：审核状态页面
    └── resubmit_page.dart            # 新增：重新提交页面
```

```
native_app/lib/features/user/
└── models/
    └── user_model.dart               # 修改：UserModel 新增 auditStatus, auditRemark, auditTime
```

```
native_app/assets/images/
└── audit_bg.png                      # 新增：审核状态页背景图
```

---

## App 端页面详情

### 1. 审核状态页（AccountReviewPage）- 新增

- **路由**: `/account-review`
- **类型**: 全屏页面
- **背景**: 使用 `assets/images/audit_bg.png` 作为全屏背景图

**路由参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | String | 是 | 手机号（从注册页或登录页传入） |

**布局结构:**
```
Scaffold
├── Body (Stack)
│   ├── Positioned.fill → Image.asset('assets/images/audit_bg.png', fit: BoxFit.cover)
│   └── SafeArea
│       └── SingleChildScrollView
│           └── Padding
│               └── Column
│                   ├── SizedBox(height: 60)
│                   ├── _buildStatusIcon()     // 状态图标（根据 auditStatus 切换）
│                   ├── SizedBox(height: 24)
│                   ├── _buildStatusTitle()     // 状态标题
│                   ├── SizedBox(height: 8)
│                   ├── _buildStatusSubtitle()  // 状态副标题
│                   ├── SizedBox(height: 40)
│                   ├── _buildInfoCard()        // 申请信息卡片
│                   ├── SizedBox(height: 24)
│                   └── _buildActionButtons()   // 操作按钮区
```

**状态图标:**
| auditStatus | 图标 | 颜色 | 说明 |
|-------------|------|------|------|
| 0 (待审核) | `Icons.access_time_filled` | `AppColors.primary` (蓝色) | 蓝色圆形背景 + 白色时钟图标 |
| 1 (已通过) | `Icons.check_circle` | `AppColors.success` (绿色) | 绿色圆形背景 + 白色对勾图标 |
| 2 (已驳回) | `Icons.cancel` | `AppColors.error` (红色) | 红色圆形背景 + 白色 × 图标 |

**状态标题与副标题:**
| auditStatus | 标题 | 副标题 |
|-------------|------|--------|
| 0 | 审核中 | 您的申请已提交，平台正在审核中\n请耐心等待审核结果 |
| 1 | 审核通过 | 恭喜，您的账号已通过审核\n现在可以登录使用了 |
| 2 | 审核驳回 | 很遗憾，您的申请未通过审核\n请根据驳回原因修改后重新提交 |

**信息卡片:**
```
Container (白色半透明背景, 圆角16, 阴影)
├── Padding(all: 20)
│   └── Column
│       ├── _buildInfoRow('手机号', '138****0000')
│       ├── Divider
│       ├── _buildInfoRow('昵称', '张三')
│       ├── Divider
│       ├── _buildInfoRow('注册时间', '2025-07-06 10:00:00')
│       ├── Divider
│       ├── _buildInfoRow('审核状态', '待审核' / '已通过' / '已驳回')
│       ├── (仅 auditStatus=2 时显示)
│       │   ├── Divider
│       │   └── _buildInfoRow('驳回原因', '提交的资料不完整...')
│       └── 
```

**操作按钮:**
| auditStatus | 按钮 | 说明 |
|-------------|------|------|
| 0 (待审核) | 「刷新状态」(FilledButton) + 「返回登录」(OutlinedButton) | 刷新重新查询状态；返回登录页 |
| 1 (已通过) | 「去登录」(FilledButton) | 跳转到 /login |
| 2 (已驳回) | 「修改信息重新提交」(FilledButton) + 「返回登录」(OutlinedButton) | 跳转到 /resubmit?phone=xxx |

**交互逻辑:**
- 页面加载时自动查询一次审核状态（调用 `GET /api/app/auth/audit-status?phone=xxx`）
- 点击「刷新状态」按钮手动刷新审核状态
- 审核通过：显示通过图标和「去登录」按钮，点击跳转到登录页
- 审核驳回：显示驳回图标、驳回原因和「修改信息重新提交」按钮
- 审核中：显示等待图标和「刷新状态」按钮
- 错误提示：使用 `AppMessage.error()` 展示错误信息（如手机号未注册）
- 加载状态：刷新时按钮显示 Loading

**状态管理:**
- ViewModel: `AccountReviewViewModel` (Notifier)
- 状态类型: `AccountReviewState` (Freezed)
  ```dart
  @freezed
  abstract class AccountReviewState with _$AccountReviewState {
    const factory AccountReviewState({
      @Default(false) bool isLoading,
      @Default(0) int auditStatus, // 0=待审核, 1=已通过, 2=已驳回
      String? auditRemark,
      String? nickname,
      String? phone,
      String? createTime,
      String? errorMessage,
    }) = _AccountReviewState;
  }
  ```

**API 调用:**
- 查询审核状态: `GET /api/app/auth/audit-status?phone=xxx`

---

### 2. 重新提交页（ResubmitPage）- 新增

- **路由**: `/resubmit`
- **类型**: 全屏页面
- **背景**: 与注册页一致的 Banner + 下方表单布局

**路由参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | String | 是 | 手机号（从审核状态页传入） |

**布局结构:**
```
Scaffold
├── Body (Column)
│   ├── _buildBrandingSection()   // Banner 区域（复用注册页样式）
│   └── Expanded
│       └── Container (白色背景)
│           └── SingleChildScrollView
│               └── Form
│                   └── Column
│                       ├── Text('修改信息重新提交')
│                       ├── Text('请修改以下信息后重新提交审核')
│                       ├── _buildInputField(phone, readOnly: true)  // 手机号（只读）
│                       ├── SmsCodeInput(phone, scene: 'REGISTER')
│                       ├── _buildInputField(nickname)    // 昵称（可编辑）
│                       ├── _buildInputField(password)    // 新密码
│                       ├── _buildInputField(confirmPassword)
│                       ├── FilledButton('重新提交')
│                       └── GestureDetector('返回审核状态页')
```

**交互逻辑:**
- 页面加载时通过 `GET /api/app/auth/audit-status?phone=xxx` 获取当前信息，预填昵称
- 手机号字段只读，不可修改
- 昵称字段可编辑，预填当前昵称
- 密码字段需重新输入（不回显旧密码）
- 确认密码字段需与密码一致
- 点击「重新提交」：表单校验 → 调用 `POST /api/app/auth/resubmit`
- 成功后跳转回 `/account-review?phone=xxx`
- 失败时显示错误信息
- 加载状态：按钮显示 Loading

**表单验证:**
- 手机号：只读，无需验证
- 验证码：必填，6位数字
- 昵称：可选，最长64位
- 密码：必填，8-20位，包含字母和数字（与注册页一致）
- 确认密码：必填，与密码一致

**状态管理:**
- ViewModel: `ResubmitViewModel` (Notifier)
- 状态类型: `ResubmitState` (Freezed)
  ```dart
  @freezed
  abstract class ResubmitState with _$ResubmitState {
    const factory ResubmitState({
      @Default(false) bool isLoading,
      String? nickname,
      String? errorMessage,
    }) = _ResubmitState;
  }
  ```

**API 调用:**
- 获取当前信息: `GET /api/app/auth/audit-status?phone=xxx`
- 重新提交: `POST /api/app/auth/resubmit`

---

### 3. 注册页（RegisterPage）- 修改

- **路由**: `/register`
- **类型**: 全屏页面

**变更说明:**
- 注册成功后不再自动登录、不保存 Token
- 注册成功后跳转到审核状态页，传递手机号参数
- `RegisterViewModel.register()` 返回值从 `bool`（成功/失败）改为 `String?`（成功返回手机号，失败返回 null）

**交互逻辑变更:**
```
旧: register() → 成功 → 返回 true → 自动登录跳转 /home
新: register() → 成功 → 返回 phone → 跳转 /account-review?phone=xxx
```

**RegisterViewModel 变更:**
```dart
// 旧
Future<bool> register(String phone, String password, String code, {String? nickname})

// 新
Future<String?> register(String phone, String password, String code, {String? nickname})
// 返回 phone 表示注册成功（需跳转审核页），返回 null 表示失败
```

**RegisterState 变更:** 无变更，仅 register 方法返回值类型变化

**API 调用变更:**
```
旧: POST /api/app/auth/register → 返回 {accessToken, refreshToken, user}
新: POST /api/app/auth/register → 返回 {user: {id, phone, ..., auditStatus: 0}}
```

**AuthRemoteDataSource.register 变更:**
```dart
// 旧: 返回 Map<String, dynamic>（含 accessToken, refreshToken, user）
// 新: 返回 Map<String, dynamic>（仅含 user 对象）
```

**AuthRepositoryImpl.register 变更:**
```dart
// 旧: 解析 LoginResponse，调用 _handleLoginResponse 保存 Token
// 新: 解析 RegisterResponse（仅含 user），不保存 Token，返回 RegisterResponse
```

---

### 4. 登录页（LoginPage）- 修改

- **路由**: `/login`
- **类型**: 全屏页面

**变更说明:**
- 登录失败时，需识别审核相关错误码（10017、10018）并给出特定提示
- 错误码 10017（待审核）：提示「账号审核中，请耐心等待」并可跳转审核状态页
- 错误码 10018（审核拒绝）：提示「注册审核未通过」+ 驳回原因，可跳转审核状态页

**交互逻辑变更:**
- `LoginViewModel.loginByPassword()` 和 `loginBySms()` 方法保持 `Future<bool>` 返回值
- 新增 `LoginState.errorCode` 字段，记录错误码用于页面判断跳转
- 当 `ApiException.code == 10017` 时，`errorMessage` 提示用户并附带「查看审核状态」引导
- 当 `ApiException.code == 10018` 时，`errorMessage` 显示驳回原因并附带「查看审核状态」引导
- 登录页监听 `errorCode`，当为 10017 或 10018 时，在 SnackBar 中增加「去查看」操作按钮
- 点击「去查看」跳转到 `/account-review?phone=xxx`（phone 为当前输入的手机号）

**LoginState 变更:**
```dart
@freezed
abstract class LoginState with _$LoginState {
  const factory LoginState({
    @Default(false) bool isLoading,
    String? errorMessage,
    @Default(0) int? errorCode, // 新增：记录错误码，用于页面判断跳转逻辑
  }) = _LoginState;
}
```

**API 调用:** 无新增，仅错误处理逻辑变更

---

### 5. 用户模型变更（UserModel）

> 对应文件: `native_app/lib/features/user/models/user_model.dart`

新增字段：
```dart
@freezed
abstract class UserModel with _$UserModel {
  const factory UserModel({
    required int id,
    required String phone,
    String? username,
    String? nickname,
    String? avatar,
    String? email,
    required int status,
    int? auditStatus,      // 新增
    String? auditRemark,   // 新增
    String? auditTime,     // 新增
    String? createTime,
    String? updateTime,
  }) = _UserModel;
}
```

---

## 管理端目录结构变更

```
admin/src/
├── pages/
│   └── AppUserPage.tsx              # 新增：App 用户管理页
├── services/api/
│   └── appUser.ts                   # 新增：App 用户 API 服务
└── types/
    └── api.ts                      # 修改：AppUserInfo 新增审核字段；新增 AuditUserRequest 类型
```

---

## 管理端类型定义

> 对应文件: `admin/src/types/api.ts`

### AppUserInfo（修改现有）

新增字段：
```typescript
export interface AppUserInfo {
  id: number
  phone: string
  username: string
  nickname: string
  avatar: string | null
  email: string | null
  status: number
  auditStatus: number     // 新增：0-待审核, 1-已通过, 2-已拒绝
  auditRemark: string | null  // 新增：驳回原因
  auditTime: string | null    // 新增：审核时间
  createTime: string
  updateTime: string
}
```

### AuditUserRequest（新增）

```typescript
export interface AuditUserRequest {
  auditStatus: number  // 1-通过, 2-拒绝
  auditRemark?: string // 拒绝时必填
}
```

---

## 管理端页面详情

### 1. App 用户管理页（AppUserPage）- 新增

- **路由**: `/app-users`
- **类型**: 管理端内嵌页面（AdminLayout 内）

**布局结构:**
```
div.space-y-4
├── div.flex.items-center.justify-between
│   ├── h2 'App 用户管理'
│   └── (无新增按钮，App 用户由用户自行注册)
├── Card
│   └── CardContent.p-4
│       ├── div.mb-4.flex.gap-2 (筛选区)
│       │   ├── Input (搜索用户名)
│       │   └── Select (审核状态筛选: 全部 / 待审核 / 已通过 / 已拒绝)
│       └── Table
│           ├── TableHeader
│           │   ├── TableHead '手机号'
│           │   ├── TableHead '用户名'
│           │   ├── TableHead '昵称'
│           │   ├── TableHead '审核状态'
│           │   ├── TableHead '注册时间'
│           │   └── TableHead '操作'
│           └── TableBody
│               └── TableRow (每行)
│                   ├── TableCell (手机号)
│                   ├── TableCell (用户名)
│                   ├── TableCell (昵称)
│                   ├── TableCell (Badge: 待审核=warning / 已通过=success / 已拒绝=destructive)
│                   ├── TableCell (注册时间)
│                   └── TableCell.text-right
│                       └── (仅 auditStatus=0 时显示)
│                           ├── Button '通过' (variant=success, size=sm)
│                           └── Button '拒绝' (variant=destructive, size=sm)
```

**审核对话框（拒绝原因）:**
```
Dialog
├── DialogHeader
│   └── DialogTitle '拒绝用户 - {phone}'
├── div.space-y-2
│   ├── Label '拒绝原因'
│   └── Textarea (placeholder: '请输入拒绝原因...')
├── DialogFooter
│   ├── Button '取消'
│   └── Button '确认拒绝' (variant=destructive)
```

**交互逻辑:**
- 页面加载时分页查询 App 用户列表（`GET /api/admin/users`）
- 支持按用户名搜索和审核状态筛选
- 待审核用户行操作列显示「通过」和「拒绝」按钮
- 点击「通过」：直接调用审核接口（`POST /api/admin/users/{id}/audit`，`auditStatus=1`）
- 点击「拒绝」：弹出拒绝原因对话框，填写后调用审核接口（`auditStatus=2`）
- 审核成功后刷新列表
- 已审核用户行不显示审核按钮
- 分页支持：上一页/下一页

**API 调用:**
- 分页查询: `GET /api/admin/users?page=1&size=10&username=xxx&auditStatus=0`
- 审核用户: `POST /api/admin/users/{id}/audit`

---

## 路由变更

### App 端路由（app_router.dart）

新增路由：
```dart
/// 审核状态页 (免登录)
static const String accountReview = '/account-review';

/// 重新提交页 (免登录)
static const String resubmit = '/resubmit';
```

免登录白名单 `_publicRoutes` 新增：
```dart
const _publicRoutes = {
  RoutePaths.login,
  RoutePaths.welcome,
  RoutePaths.register,
  RoutePaths.resetPassword,
  RoutePaths.accountReview,   // 新增
  RoutePaths.resubmit,        // 新增
};
```

路由定义新增：
```dart
// 审核状态页
GoRoute(
  path: RoutePaths.accountReview,
  builder: (context, state) => AccountReviewPage(
    phone: state.uri.queryParameters['phone'] ?? '',
  ),
),

// 重新提交页
GoRoute(
  path: RoutePaths.resubmit,
  builder: (context, state) => ResubmitPage(
    phone: state.uri.queryParameters['phone'] ?? '',
  ),
),
```

### 管理端路由（router.tsx）

新增路由：
```typescript
// App user management route
const appUserRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/app-users',
  component: AppUserPage,
})
```

路由树更新：
```typescript
const routeTree = rootRoute.addChildren([
  authRoute.addChildren([loginRoute]),
  adminRoute.addChildren([homeRoute, menuRoute, roleRoute, adminUserRoute, appUserRoute]),
])
```

---

## 背景图资源

| 资源 | 路径 | 用途 | 说明 |
|------|------|------|------|
| audit_bg.png | `native_app/assets/images/audit_bg.png` | 审核状态页背景 | 科研主题浅蓝渐变，含 DNA 双螺旋、分子结构等元素 |

**pubspec.yaml 更新:**
```yaml
flutter:
  assets:
    - assets/images/
    # 已包含该目录，新增图片自动识别
```

> 注意：如果 `assets/images/` 目录已在 pubspec.yaml 中声明，则新增的 `audit_bg.png` 无需额外配置。
