# Feature-First 文件结构规范

## 目录结构

```
lib/
├── app/                    # 应用配置
│   ├── app.dart            # 应用主组件
│   └── router.dart         # 路由配置
├── core/                   # 核心模块
│   ├── config/             # 环境配置（Dev/Prod）
│   ├── network/            # 网络层（ApiResponse、Dio、异常）
│   ├── provider/           # 全局 Provider
│   ├── storage/            # 本地存储
│   ├── theme/              # 主题
│   └── utils/              # 工具类
├── features/{feature_name}/ # 功能模块
│   ├── models/             # Freezed 数据模型
│   ├── repositories/       # 接口、Impl
│   ├── datasources/        # 可选，远程数据源
│   ├── view/               # 页面 Widget
│   └── view_model/         # Riverpod Provider / Notifier
└── main.dart
```

## 分层数据流

```
View → ViewModel → Repository → DataSource → Model
```

- **View**: 纯 UI 渲染，通过 `ref.watch` 监听 ViewModel 状态
- **ViewModel**: 管理 UI 状态，调用 Repository 获取/修改数据
- **Repository**: 业务逻辑聚合层，协调多个 DataSource
- **DataSource**: 单一数据源（远程 API）
- **Model**: Freezed 数据类，不可变

## Repository 规范

### 文件结构

```
features/{feature_name}/repositories/
├── {name}_repository.dart          # 抽象接口（abstract class）
└── {name}_repository_impl.dart     # 实现类
```

### 抽象接口

```dart
abstract class UserRepository {
  Future<UserModel> getById(String id);
  Future<List<UserModel>> getList();
  Future<void> create(CreateUserRequest request);
}
```

### 实现类

```dart
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remoteDataSource;

  UserRepositoryImpl({required UserRemoteDataSource remoteDataSource})
      : _remoteDataSource = remoteDataSource;

  @override
  Future<UserModel> getById(String id) async {
    final response = await _remoteDataSource.getUserById(id);
    return UserModel.fromJson(response.data!);
  }

  // ...
}
```

### Riverpod 注册

```dart
final userRepositoryProvider = Provider<UserRepository>((ref) {
  final remoteDataSource = ref.read(userRemoteDataSourceProvider);
  return UserRepositoryImpl(remoteDataSource: remoteDataSource);
});
```

- ViewModel 只依赖抽象接口 `UserRepository`，不直接引用 `UserRepositoryImpl`
- Provider 注册时提供 `Impl` 实现，调用方无感知

## 新增功能模块 Checklist

1. 创建 `features/{feature_name}/` 目录
2. 在 `models/` 下定义 Freezed 数据模型
3. 在 `repositories/` 下创建接口 + `Impl`
4. 按需创建 `datasources/`（远程数据源）
5. 在 `view_model/` 下创建 Riverpod Provider / Notifier
6. 在 `view/` 下创建页面 Widget
7. 在 `app/router.dart` 中注册路由
