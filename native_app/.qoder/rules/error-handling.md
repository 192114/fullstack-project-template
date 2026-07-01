# 错误处理规范

## 异常分类

```
core/network/api_exception.dart
```

| 异常类型 | 触发场景 | 示例 |
|---------|---------|------|
| `NetworkException` | 无网络、超时、DNS 失败 | 连接超时、SocketException |
| `ApiException` | 后端返回 `code != 200` | 业务错误码 10001 "用户名已存在" |
| `ParseException` | JSON 解析失败、类型不匹配 | `FormatException`、字段缺失 |
| `AuthException` | Token 失效或刷新失败 | 401 响应 + refreshToken 失败 |
| `UnknownException` | 未预期的异常兜底 | 其他未分类异常 |

## 异常定义

```dart
class ApiException implements Exception {
  final int code;
  final String message;
  const ApiException({required this.code, required this.message});
}

class NetworkException implements Exception {
  final String message;
  const NetworkException({required this.message});
}

class AuthException implements Exception {
  final String message;
  const AuthException({required this.message});
}
```

## 异常抛出层级

| 层级 | 职责 | 行为 |
|------|------|------|
| **DataSource** | 捕获 DioException → 转为对应自定义异常 | 抛出 `NetworkException` / `ApiException` / `AuthException` |
| **Repository** | 透传 DataSource 异常，或包装为更具体的业务异常 | 不吞异常，可附加上下文信息 |
| **ViewModel** | 捕获异常 → 更新 UI 状态 | 更新 `errorMessage` 或 `AsyncValue.error` |
| **View** | 监听状态 → 展示错误 | 根据异常类型选择展示方式 |

## UI 错误展示模式

| 场景 | 展示方式 | 自动消失 |
|------|---------|---------|
| 表单字段校验失败 | 字段下方内联红色提示 | 否（用户修改后消失） |
| 接口业务异常（如用户名已存在） | SnackBar / Toast | 是（3 秒） |
| 网络异常（无网络/超时） | 全屏错误页 + 重试按钮 | 否 |
| 认证失败（401） | 跳转登录页 | - |
| 操作成功提示 | SnackBar（绿色） | 是（2 秒） |
| 服务器异常（500） | Dialog 弹窗 | 否（用户手动关闭） |

## ViewModel 错误处理模板

```dart
Future<void> submitForm() async {
  state = state.copyWith(isLoading: true, errorMessage: null);
  try {
    await ref.read(userRepositoryProvider).createUser(
      name: state.name,
      email: state.email,
    );
    state = state.copyWith(isLoading: false);
  } on ApiException catch (e) {
    state = state.copyWith(isLoading: false, errorMessage: e.message);
  } on NetworkException catch (e) {
    state = state.copyWith(isLoading: false, errorMessage: '网络异常，请检查网络连接');
  } catch (e) {
    state = state.copyWith(isLoading: false, errorMessage: '未知错误，请稍后重试');
  }
}
```

## View 错误监听

```dart
// 监听 errorMessage 变化，弹出 SnackBar
ref.listen<LoginState>(loginNotifierProvider, (prev, next) {
  if (next.errorMessage != null && next.errorMessage != prev?.errorMessage) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(next.errorMessage!)),
    );
  }
});
```

## 禁止行为

- 禁止在 DataSource 层吞掉异常（返回 null 或空数据代替错误）
- 禁止在 ViewModel 中 catch 后不更新错误状态
- 禁止在 View 中直接 try-catch 网络请求（应由 ViewModel 处理）
- 禁止用 `print()` 代替正式的错误日志（Debug 可用 `debugPrint`）
