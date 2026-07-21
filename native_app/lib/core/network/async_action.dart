import 'api_exception.dart';

/// 一次异步操作的结果，收敛各 ViewModel 里重复的 try/catch 错误映射
class AsyncActionResult<T> {
  final bool success;
  final T? data;
  final String? errorMessage;
  final int? errorCode;

  const AsyncActionResult.success(this.data)
      : success = true,
        errorMessage = null,
        errorCode = null;

  const AsyncActionResult.failure(this.errorMessage, {this.errorCode})
      : success = false,
        data = null;
}

/// 执行 [action]，统一捕获 [ApiException] 与未知异常
Future<AsyncActionResult<T>> runAsyncAction<T>(
  Future<T> Function() action,
) async {
  try {
    final data = await action();
    return AsyncActionResult.success(data);
  } on ApiException catch (e) {
    return AsyncActionResult.failure(e.message, errorCode: e.code);
  } catch (_) {
    return AsyncActionResult.failure('未知错误，请稍后重试');
  }
}
