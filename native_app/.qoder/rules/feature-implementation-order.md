# 功能实现顺序规范

## 实现一个新 Feature 的文件创建顺序

严格按以下顺序创建文件，确保依赖关系自底向上：

### 1. 创建功能目录

```
lib/features/{feature_name}/
├── models/
├── datasources/
├── repositories/
├── view_model/
└── view/
```

### 2. 定义数据模型 (`models/`)

- 使用 Freezed + JsonSerializable 定义 Model
- 文件：`{name}_model.dart`
- 执行 `build_runner` 生成 `*.freezed.dart` 和 `*.g.dart`

### 3. 实现数据源 (`datasources/`)（按需）

- 远程数据源：`{name}_remote_datasource.dart`
- 注入 `ApiClient`，处理 DioException → 自定义异常
- 返回原始 JSON 或 Freezed Model

### 4. 定义 Repository 接口 + 实现 (`repositories/`)

- 抽象接口：`{name}_repository.dart`（`abstract class`）
- 实现类：`{name}_repository_impl.dart`（`implements` 接口）
- 构造注入 DataSource，调用方只依赖接口
- 定义 Riverpod Provider，返回接口类型，提供 Impl 实例

### 5. 实现 ViewModel (`view_model/`)

- 使用 Riverpod `Notifier` / `AsyncNotifier`
- 通过 `ref.read(repositoryProvider)` 获取 Repository（接口类型）
- 状态更新使用 `copyWith`，异步操作用 `AsyncValue.guard()`
- 错误捕获分层：`ApiException` / `NetworkException` / 兜底

### 6. 创建页面 View (`view/`)

- 文件：`{name}_page.dart`
- 通过 `ref.watch(notifierProvider)` 监听状态
- 通过 `ref.listen` 处理一次性事件（SnackBar / Dialog）
- 错误展示根据异常类型选择对应 UI 模式

### 7. 注册路由 (`app/router.dart`)

- 添加新路由映射到对应 Page
- 按需配置路由守卫（如需要登录）

## 实现顺序决策树

```
用户提出功能需求
  → 涉及新数据结构？ → 先创建 Model（第 2 步）
  → 涉及网络请求？ → 先创建 DataSource（第 3 步）
  → 纯前端逻辑？ → 跳过 2/3，直接 ViewModel + View
  → 所有场景最后 → 注册路由（第 7 步）
```

## 约束

- 禁止跳步：View 依赖 ViewModel，ViewModel 依赖 Repository，必须按序创建
- 每个文件创建后立即确认 import 路径规范（同模块相对路径，跨模块绝对路径）
- Model 创建后必须立即执行 `build_runner`，再进入下一步
- 禁止在 View 中直接调用 Repository 或 DataSource（必须经过 ViewModel）
