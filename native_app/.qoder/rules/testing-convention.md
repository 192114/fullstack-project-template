# 测试编写规范（分级要求，非全面禁止）

项目**建议**为状态管理逻辑和公共方法编写单元测试，但**不写** UI/Widget 测试。

## 建议写测试

- ViewModel/Notifier 的状态流转逻辑（如 `login_view_model.dart`、`register_view_model.dart`、
  `reset_password_view_model.dart`、`resubmit_view_model.dart`、`account_review_view_model.dart`、
  `change_password_view_model.dart`、`profile_view_model.dart`）
- 纯逻辑的公共方法/工具类，无 UI/框架耦合、复用度高（如 `core/network/async_action.dart` 的 `runAsyncAction`）

## 不要写测试

- `view/` 下的页面、Widget 测试（`testWidgets()`）、Golden 测试
- `core/router/` 路由/导航相关（涉及页面跳转，不算状态管理逻辑）
- Freezed/json_serializable 生成的 `.freezed.dart`/`.g.dart` 代码本身
- DataSource/Repository 层的网络请求（如果确有必要测，先与项目约定沟通，不默认要求）

## 写法要求

- 用 `flutter_test` 自带的 `test()`/`group()`/`expect()`，测试放在 `test/` 目录下，路径结构镜像 `lib/`
  （如 `lib/features/auth/view_model/login_view_model.dart` → `test/features/auth/view_model/login_view_model_test.dart`）
- **不引入** mocktail/mockito 等 Mock 依赖库：仓库里的 Repository 已经是抽象类（如 `AuthRepository`），
  测试里手写一个实现该抽象类的 Fake 类即可，不需要额外依赖
- 用 Riverpod 的 `ProviderContainer` + `overrideWithValue(repositoryProvider, fakeRepository)` 隔离依赖，
  不要在测试里发真实网络请求
- 一个方法测多个分支（成功 + 每种失败原因），不要只测 happy path

## 参考技能包的取舍

`native_app/.qoder/skills/flutter-apply-architecture-best-practices`、
`flutter-implement-json-serialization` 等通用参考技能包中关于测试的建议，**只采纳 ViewModel 状态测试部分**；
其提到的 Widget 测试、Repository/DataSource 层测试、Freezed 序列化测试均超出本项目范围，不要采纳。
