# 网络层规范（Dio）

## 架构总览

```
core/network/
├── api_client.dart          # Dio 封装 + 统一请求方法
├── api_response.dart        # 后端 Result<T> 的 Dart 映射
├── api_exception.dart       # 网络层异常定义
└── interceptors/
    ├── auth_interceptor.dart    # Token 注入 + 401 刷新
    ├── log_interceptor.dart     # 请求/响应日志（仅 Dev）
    └── retry_interceptor.dart   # 可选，失败重试
```

## Dio 封装

```dart
class ApiClient {
  late final Dio _dio;

  ApiClient({required BaseOptions options}) {
    _dio = Dio(options);
    _dio.interceptors.addAll([
      authInterceptor,
      if (kDebugMode) logInterceptor,
    ]);
  }

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) fromJson,
  }) async { ... }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) fromJson,
  }) async { ... }
  // put / delete / patch 同理
}
```

## ApiResponse 映射

对应后端 `Result<T>` 结构：

```dart
class ApiResponse<T> {
  final int code;
  final String msg;
  final T? data;

  bool get isSuccess => code == 200;

  // 分页响应时使用
  ApiPageResponse<T> get asPage => this as ApiPageResponse<T>;
}

class ApiPageResponse<T> extends ApiResponse<T> {
  final int current;
  final int size;
  final int total;
  final int pages;
  final List<T> records;
}
```

## 拦截器链（执行顺序）

| 顺序 | 拦截器 | 职责 |
|------|--------|------|
| 1 | `AuthInterceptor` | 请求注入 `Authorization: Bearer <token>`；响应 401 时触发 token 刷新或跳转登录 |
| 2 | `LogInterceptor` | 打印请求/响应详情（仅 Debug 模式启用） |
| 3 | `RetryInterceptor`（可选） | 网络超时自动重试（最多 2 次，仅 GET） |

## Token 刷新策略

```
请求发出 → 收到 401 响应
  → 暂停后续请求
  → 调用 refreshToken API
  → 成功：更新 token，重发原请求
  → 失败：清除本地 token，跳转登录页
```

## 环境配置

| 环境 | Base URL | Log |
|------|----------|-----|
| Dev | `http://localhost:8080/api` | 开启 |
| Prod | `https://api.example.com` | 关闭 |

通过 `core/config/` 下的环境配置类切换，不在网络层硬编码 URL。

## 请求规范

- 所有 API 路径以 `/api/` 为前缀（与后端 `@RequestMapping` 对齐）
- GET 请求参数通过 `queryParameters` 传递
- POST/PUT 请求体使用 `data` 参数，自动序列化为 JSON
- 统一使用 `ApiResponse<T>` 作为返回类型，`fromJson` 回调负责 `data` 字段到 Model 的转换
- 网络层只负责 HTTP 通信和数据解析，不包含业务逻辑
