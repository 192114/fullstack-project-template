# native_app

Flutter 客户端模板，Feature-first 分层 + Riverpod 状态管理。

## 技术栈

| 组件 | 说明 |
|------|------|
| Riverpod 3 (Notifier API) | 状态管理 |
| Freezed + json_serializable | 数据类 / 序列化 |
| GoRouter | 声明式路由，登录态守卫见 `core/router` |
| Dio | 网络请求，拦截器自动注入 token（`core/network`） |
| flutter_secure_storage | Token 等敏感数据存储 |
| flutter_dotenv | 多环境变量（`config/env/.env.dev`、`.env.prod`） |

## 目录结构

```
lib/
├── config/
│   ├── env/            # 多环境变量（.env.dev / .env.prod）
│   └── theme/           # 设计系统常量（颜色、字体、间距）
├── core/
│   ├── network/          # dio_client、拦截器、ApiException、Token 管理
│   │                      # async_action.dart：收敛 ViewModel 里重复的 try/catch 错误映射
│   ├── router/            # GoRouter 配置 + 登录态守卫
│   └── storage/           # 本地存储封装
├── features/
│   ├── auth/               # 登录/注册/审核状态/重新提交
│   │   ├── datasources/      # 远程数据源（Dio 调用）
│   │   ├── repositories/     # 仓储接口 + 实现
│   │   ├── models/            # Freezed 数据模型
│   │   ├── view_model/        # Riverpod Notifier + State
│   │   └── view/               # 页面 Widget
│   └── user/                # 结构与 auth 一致
└── shared/widgets/          # 跨 feature 复用的组件（如 dialog）
```

新增 feature 时按 `datasources → repositories → view_model → view` 的顺序补齐，参考 `features/auth` 即可。

## 收敛重复的 loading/error 状态机

`features/auth/view_model/` 下几个表单类 ViewModel（login/register/reset_password/resubmit/account_review）都遵循同一个模式：

```dart
state = state.copyWith(isLoading: true, errorMessage: null);
final result = await runAsyncAction(() => someRepositoryCall());
state = state.copyWith(isLoading: false, errorMessage: result.errorMessage, ...);
return result.success;
```

`runAsyncAction`（`core/network/async_action.dart`）统一处理 `ApiException` 与未知异常的捕获和消息映射，新增表单页时复用它，不需要再手写一遍 `try/catch`。

## 常用命令

```bash
flutter pub get
flutter run
flutter analyze
flutter test
```
