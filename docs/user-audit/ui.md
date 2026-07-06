# 用户注册审核 - UI 文档

## 页面列表

### App 端（Flutter）

| 页面 | 路由 | 描述 | 变更类型 |
|------|------|------|----------|
| AccountReviewPage | /account-review | 账号审核状态页（注册成功后跳转） | **新增** |
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
│   └── auth_models.dart              # 修改：RegisterResponse 替代 LoginResponse
├── datasources/
│   └── auth_remote_datasource.dart   # 修改：register 返回 RegisterResponse；新增 getAuditStatus
├── repositories/
│   └── auth_repository_impl.dart     # 修改：register 不再保存 Token；新增 getAuditStatus
├── view_model/
│   ├── register_view_model.dart      # 修改：register 返回审核状态而非自动登录
│   ├── account_review_view_model.dart # 新增：审核状态管理
│   └── auth_provider.dart            # 修改：新增 AccountReviewViewModel Provider
└── view/
    ├── register_page.dart            # 修改：注册成功后跳转审核页
    └── account_review_page.dart      # 新增：审核状态页面
```

```
native_app/lib/features/user/
└── models/
    └── user_model.dart               # 修改：UserModel 新增 auditStatus, auditRemark, auditTime
```

---

## App 端页面详情

### 1. 账号审核状态页（AccountReviewPage）- 新增

- **路由**: `/account-review`
- **类型**: 全屏页面（免登录）

**布局结构:**
```
Scaffold
├── Body (Center)
│   ├── Column
│   │   ├── Icon (审核中: hourglass_top / 通过: check_circle / 拒绝: cancel)
│   │   ├── SizedBox
│   │   ├── Text (标题: '账号审核中' / '审核通过' / '审核未通过')
│   │   ├── SizedBox
│   │   ├── Text (描述信息)
│   │   │   ├── 审核中: '您的账号正在审核中，请耐心等待管理员审核通过后即可登录'
│   │   │   ├── 通过: '恭喜！您的账号已审核通过，现在可以登录了'
│   │   │   └── 拒绝: '很抱歉，您的注册审核未通过。原因：{auditRemark}'
│   │   ├── SizedBox
│   │   ├── Card (可选: 展示手机号脱敏)
│   │   │   └── Row (手机号: 138****0000)
│   │   ├── SizedBox
│   │   └── 按钮区域
│   │       ├── 审核中: FilledButton('刷新状态') + OutlinedButton('返回登录')
│   │       ├── 通过: FilledButton('去登录' → /login)
│   │       └── 拒绝: FilledButton('重新注册' → /register) + OutlinedButton('返回登录')
```

**交互逻辑:**
- 页面接收参数：手机号 `phone`（从注册页跳转时传入）
- 页面加载时自动查询一次审核状态（调用 `GET /api/app/auth/audit-status?phone=xxx`）
- 点击「刷新状态」按钮手动刷新审核状态
- 审核通过：显示通过图标和「去登录」按钮，点击跳转到登录页
- 审核拒绝：显示拒绝图标、拒绝原因和「重新注册」按钮
- 审核中：显示等待图标和「刷新状态」按钮
- 错误提示：使用 SnackBar 展示错误信息（如手机号未注册）
- 加载状态：刷新时按钮显示 Loading

**状态管理:**
- ViewModel: `AccountReviewViewModel` (Notifier)
- 状态类型: `AccountReviewState` (Freezed)
  ```dart
  @freezed
  abstract class AccountReviewState with _$AccountReviewState {
    const factory AccountReviewState({
      @Default(false) bool isLoading,
      @Default(0) int auditStatus, // 0=待审核, 1=已通过, 2=已拒绝
      String? auditRemark,
      String? errorMessage,
    }) = _AccountReviewState;
  }
  ```

**API 调用:**
- 查询审核状态: `GET /api/app/auth/audit-status?phone=xxx`

---

### 2. 注册页（RegisterPage）- 修改

- **路由**: `/register`
- **类型**: 全屏页面

**变更说明:**
- 注册成功后不再自动登录、不保存 Token
- 注册成功后跳转到审核状态页，传递手机号参数
- `RegisterViewModel.register()` 返回值从 `bool`（成功/失败）改为 `String?`（成功返回手机号，失败返回 null）

**交互逻辑变更:**
```
旧: register() → 成功 → 返回 true → 跳转 /home（自动登录）
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

**RegisterState 变更:**
```dart
@freezed
abstract class RegisterState with _$RegisterState {
  const factory RegisterState({
    @Default(false) bool isLoading,
    String? errorMessage,
  }) = _RegisterState;
}
// 无变更，仅 register 方法返回值类型变化
```

**API 调用变更:**
```
旧: POST /api/app/auth/register → 返回 {accessToken, refreshToken, user}
新: POST /api/app/auth/register → 返回 {user: {id, phone, ..., auditStatus: 0}}
```

**AuthRemoteDataSource.register 变更:**
```dart
// 旧: 返回 Map<String, dynamic>（含 accessToken, refreshToken, user）
// 新: 返回 Map<String, dynamic>（仅含 user 对象）
// _parseResponseData 提取 data 字段后，data 内为 {user: {...}}
```

**AuthRepositoryImpl.register 变更:**
```dart
// 旧: 解析 LoginResponse，调用 _handleLoginResponse 保存 Token
// 新: 解析 RegisterResponse（仅含 user），不保存 Token，返回 user 信息
```

---

### 3. 登录页（LoginPage）- 修改

- **路由**: `/login`
- **类型**: 全屏页面

**变更说明:**
- 登录失败时，需识别审核相关错误码（10017、10018）并给出特定提示
- 错误码 10017（待审核）：提示「账号审核中，请耐心等待」并可跳转审核状态页
- 错误码 10018（审核拒绝）：提示「注册审核未通过」+ 拒绝原因，可跳转注册页

**交互逻辑变更:**
- `LoginViewModel.loginByPassword()` 和 `loginBySms()` 方法保持 `Future<bool>` 返回值
- 当 `ApiException.code == 10017` 时，在 `errorMessage` 中提示用户并附带「查看审核状态」引导
- 当 `ApiException.code == 10018` 时，在 `errorMessage` 中显示拒绝原因并附带「重新注册」引导
- 登录页监听 `errorMessage`，当包含审核相关提示时，在 SnackBar 中增加「去查看」操作按钮

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

**API 调用:**
- 无新增，仅错误处理逻辑变更

---

### 4. 用户模型变更（UserModel）

> 对应文件: `native_app/lib/features/user/models/user_model.dart`

**UserModel 新增字段:**
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
    int? auditStatus,    // 新增：审核状态 0-待审核 1-已通过 2-已拒绝
    String? auditRemark,  // 新增：审核备注/拒绝原因
    String? auditTime,    // 新增：审核时间
    String? createTime,
    String? updateTime,
  }) = _UserModel;
}
```

**Auth 模型变更:**
```dart
// 新增：注册响应（替代原 LoginResponse）
@freezed
abstract class RegisterResponse with _$RegisterResponse {
  const factory RegisterResponse({
    required UserModel user,
  }) = _RegisterResponse;

  factory RegisterResponse.fromJson(Map<String, dynamic> json) =>
      _$RegisterResponseFromJson(json);
}

// 新增：审核状态响应
@freezed
abstract class AuditStatusResponse with _$AuditStatusResponse {
  const factory AuditStatusResponse({
    required int auditStatus,
    String? auditRemark,
  }) = _AuditStatusResponse;

  factory AuditStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$AuditStatusResponseFromJson(json);
}
```

---

### 5. 路由变更

> 对应文件: `native_app/lib/core/router/app_router.dart`

**新增路由路径:**
```dart
static const String accountReview = '/account-review';
```

**免登录白名单更新:**
```dart
const _publicRoutes = {
  RoutePaths.login,
  RoutePaths.welcome,
  RoutePaths.register,
  RoutePaths.resetPassword,
  RoutePaths.accountReview,  // 新增
};
```

**新增 GoRoute:**
```dart
GoRoute(
  path: RoutePaths.accountReview,
  builder: (context, state) => AccountReviewPage(
    phone: state.uri.queryParameters['phone'] ?? '',
  ),
),
```

---

## 管理端页面详情

### App 用户管理页（AppUserPage）- 新增

- **路由**: `/app-users`
- **路由文件**: `admin/src/app/router.tsx`
- **页面文件**: `admin/src/pages/AppUserPage.tsx`

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

## 管理端目录结构变更

```
admin/src/
├── pages/
│   └── AppUserPage.tsx              # 新增：App 用户管理页
├── services/api/
│   └── appUser.ts                  # 新增：App 用户 API 服务
└── types/
    └── api.ts                      # 修改：新增 AppUserVO、AuditUserRequest 类型
```

---

## 管理端类型定义

> 对应文件: `admin/src/types/api.ts`

**新增类型:**
```typescript
/** App 用户信息（管理端） */
export interface AppUserVO {
  id: number
  phone: string
  username: string | null
  nickname: string | null
  avatar: string | null
  email: string | null
  status: number
  auditStatus: number  // 0-待审核 1-已通过 2-已拒绝
  auditRemark: string | null
  auditTime: string | null
  createTime: string
  updateTime: string
}

/** 审核用户请求 */
export interface AuditUserRequest {
  auditStatus: number  // 1-通过 2-拒绝
  auditRemark?: string // 拒绝原因（拒绝时必填）
}
```

---

## 管理端 API 服务

> 对应文件: `admin/src/services/api/appUser.ts`

```typescript
import request, { requestApi } from '@/services/request'
import type {
  ApiResponse, PageResult, AppUserVO, AuditUserRequest,
} from '@/types/api'

export const appUserApi = {
  /** 分页查询 App 用户 */
  page: (params: { current?: number; size?: number; username?: string; auditStatus?: number }) =>
    requestApi<PageResult<AppUserVO>>(
      request.get<ApiResponse<PageResult<AppUserVO>>>(
        '/api/admin/users',
        { params: { current: 1, size: 10, ...params } }
      )
    ),

  /** 审核 App 用户 */
  audit: (id: number, data: AuditUserRequest) =>
    requestApi<AppUserVO>(
      request.post<ApiResponse<AppUserVO>>(
        `/api/admin/users/${id}/audit`,
        data
      )
    ),
}
```

---

## 管理端路由变更

> 对应文件: `admin/src/app/router.tsx`

**新增路由:**
```typescript
import { AppUserPage } from '@/pages/AppUserPage'

const appUserRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/app-users',
  component: AppUserPage,
})

// 路由树新增
adminRoute.addChildren([homeRoute, menuRoute, roleRoute, adminUserRoute, appUserRoute])
```

---

## 管理端侧边栏菜单变更

> 对应文件: `admin/src/layouts/AdminLayout.tsx`

在侧边栏菜单中新增「App 用户管理」入口，路径为 `/app-users`。同时需在数据库 `sys_menu` 表中插入对应菜单记录（由后端 RBAC 数据初始化或手动插入）。
