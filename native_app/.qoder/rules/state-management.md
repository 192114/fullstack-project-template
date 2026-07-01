# 状态管理规范（Riverpod）

## Provider 类型选择

| 场景 | Provider 类型 | 示例 |
|------|-------------|------|
| 全局单例服务（Dio、SharedPreferences） | `Provider` | `dioProvider`, `sharedPrefsProvider` |
| 有状态的业务逻辑（ViewModel） | `Notifier` / `@riverpod` | `loginNotifier` |
| 异步初始化的状态（用户信息、配置） | `AsyncNotifier` / `@riverpod` | `currentUserNotifier` |
| 一次性异步请求（API 调用结果） | `FutureProvider` | `userDetailProvider` |
| 实时数据流（WebSocket、监听） | `StreamProvider` | `messagesStreamProvider` |
| 简单派生状态（过滤、计算） | `Provider`（依赖其他 Provider） | `filteredUsersProvider` |

## ViewModel 职责

ViewModel（即 Notifier）只负责：
- 管理 UI 状态（loading / success / error）
- 调用 Repository 获取或修改数据
- 暴露状态供 View 监听

ViewModel **不做**：
- 直接发起 HTTP 请求（委托给 Repository）
- 操作 UI Widget（View 的职责）
- 持久化数据（委托给 DataSource / Storage）

## 状态定义

### 使用 AsyncValue 处理异步状态

```dart
// ViewModel 中
final AsyncValue<UserModel> userState;

// View 中
ref.watch(userProvider).when(
  loading: () => const LoadingWidget(),
  error: (error, stack) => ErrorWidget(error: error),
  data: (user) => UserDetailWidget(user: user),
);
```

### 自定义状态类（复杂场景）

当页面状态维度 > 2 个时，使用 Freezed 定义状态类：

```dart
@freezed
class LoginState with _$LoginState {
  const factory LoginState({
    @Default(false) bool isLoading,
    @Default('') String username,
    @Default('') String password,
    String? errorMessage,
  }) = _LoginState;
}
```

## Provider 作用域

| 层级 | 位置 | 示例 |
|------|------|------|
| 全局 | `core/provider/` | Dio、SharedPreferences、Auth 状态 |
| 功能级 | `features/{feature}/view_model/` | 页面 ViewModel、列表数据 |

## 依赖注入原则

- Repository Provider 在 `features/{feature}/repositories/` 中定义
- ViewModel 通过 `ref.read(repositoryProvider)` 获取 Repository
- 全局 Provider 在 `core/provider/` 中定义，使用 `@Riverpod(keepAlive: true)` 保持存活

## 状态更新规范

- 使用 `state = state.copyWith(...)` 更新状态（Freezed 不可变）
- 禁止直接修改 state 的属性
- 异步操作使用 `AsyncValue.guard()` 包裹以自动处理 loading/error

```dart
Future<void> login(String username, String password) async {
  state = state.copyWith(isLoading: true, errorMessage: null);
  final result = await AsyncValue.guard(
    () => ref.read(authRepositoryProvider).login(username, password),
  );
  result.when(
    data: (_) => state = state.copyWith(isLoading: false),
    error: (e, _) => state = state.copyWith(
      isLoading: false,
      errorMessage: e.toString(),
    ),
  );
}
```
