# 命名规范

## 总览

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | snake_case | `auth_model.dart`, `login_page.dart`, `user_repository_impl.dart` |
| 类 / Widget | PascalCase | `LoginPage`, `AuthRepository`, `UserModel` |
| 变量 / 方法 | camelCase | `accessToken`, `getUsers()` |
| Provider | 后缀 `Provider` | `dioProvider`, `loginNotifierProvider` |
| Repository 接口 | `XxxRepository` | `AuthRepository`, `UserRepository` |
| Repository 实现 | `XxxRepositoryImpl` | `AuthRepositoryImpl`, `UserRepositoryImpl` |

## 文件命名细则

- 数据模型: `{name}_model.dart`（如 `user_model.dart`）
- 页面: `{name}_page.dart`（如 `login_page.dart`）
- Widget 组件: `{name}_widget.dart` 或描述性名称（如 `custom_app_bar.dart`）
- ViewModel: `{name}_view_model.dart` 或 `{name}_notifier.dart`
- Repository 接口: `{name}_repository.dart`
- Repository 实现: `{name}_repository_impl.dart`
- DataSource: `{name}_remote_datasource.dart`
- Provider: `{name}_provider.dart`（如 `auth_provider.dart`）

## 类命名细则

- 数据模型: `{Name}Model`（如 `UserModel`），使用 Freezed `@freezed` 注解
- 页面 Widget: `{Name}Page`（如 `LoginPage`）
- 通用 Widget: `{Name}Widget` 或描述性名称（如 `CustomAppBar`）
- ViewModel / Notifier: `{Name}Notifier` 或 `{Name}ViewModel`（如 `LoginNotifier`）
- Repository 接口: `{Name}Repository`（如 `AuthRepository`）
- Repository 实现: `{Name}RepositoryImpl`（如 `AuthRepositoryImpl`）

## Provider 命名细则

- 普通 Provider: `{name}Provider`（如 `dioProvider`）
- Notifier Provider: `{name}NotifierProvider`（如 `loginNotifierProvider`）
- Future Provider: `{name}FutureProvider`（如 `userFutureProvider`）
- Stream Provider: `{name}StreamProvider`（如 `messagesStreamProvider`）
