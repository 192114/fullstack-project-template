import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import 'api_exception.dart';
import 'token_manager.dart';

/// API 拦截器
/// 负责 Token 注入、401 自动刷新、响应处理
class ApiInterceptor extends Interceptor {
  final TokenManager _tokenManager;
  final Logger _logger;
  final Dio _dio;

  /// 刷新 Token 的锁，防止并发刷新
  bool _isRefreshing = false;

  /// 等待刷新的请求队列
  final List<void Function()> _pendingRequests = [];

  ApiInterceptor({
    required this._tokenManager,
    required this._dio,
    Logger? logger,
  })  : _logger = logger ?? Logger();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // 注入 Authorization Header
    final authHeader = _tokenManager.authorizationHeader;
    if (authHeader != null) {
      options.headers['Authorization'] = authHeader;
    }

    _logger.d('Request: ${options.method} ${options.uri}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _logger.d('Response: ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // 处理 401 未授权
    if (err.response?.statusCode == 401) {
      _logger.w('Unauthorized: ${err.requestOptions.uri}');

      // 尝试刷新 Token
      if (_tokenManager.hasRefreshToken) {
        if (_isRefreshing) {
          // 正在刷新，加入等待队列
          _pendingRequests.add(() => _retryRequest(err, handler));
          return;
        }

        _isRefreshing = true;

        try {
          // 调用刷新 Token 接口
          final success = await _refreshToken();

          if (success) {
            // 刷新成功，重试原请求
            await _retryRequest(err, handler);

            // 处理等待队列中的请求
            for (final callback in _pendingRequests) {
              callback();
            }
          } else {
            // 刷新失败，清除 Token
            await _tokenManager.clearTokens();
            handler.reject(
              DioException(
                requestOptions: err.requestOptions,
                error: const ApiException(
                  code: 401,
                  type: ApiExceptionType.unauthorized,
                  message: '登录已过期，请重新登录',
                ),
              ),
            );
          }
        } catch (e) {
          await _tokenManager.clearTokens();
          handler.reject(
            DioException(
              requestOptions: err.requestOptions,
              error: const ApiException(
                code: 401,
                type: ApiExceptionType.unauthorized,
                message: 'Token 刷新失败',
              ),
            ),
          );
        } finally {
          _isRefreshing = false;
          _pendingRequests.clear();
        }
        return;
      }
    }

    // 其他错误，转换为 ApiException
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        error: ApiException.fromDioException(err),
      ),
    );
  }

  /// 刷新 Token
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = _tokenManager.refreshToken;
      if (refreshToken == null) return false;

      // TODO: 替换为实际的刷新 Token 接口
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(
          headers: {'Authorization': ''}, // 清除 Authorization Header
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['accessToken'] as String?;
        final newRefreshToken = response.data['refreshToken'] as String?;

        if (newAccessToken != null) {
          await _tokenManager.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );
          return true;
        }
      }
      return false;
    } catch (e) {
      _logger.e('Refresh token failed: $e');
      return false;
    }
  }

  /// 重试失败的请求
  Future<void> _retryRequest(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    try {
      final options = err.requestOptions;

      // 更新 Authorization Header
      final authHeader = _tokenManager.authorizationHeader;
      if (authHeader != null) {
        options.headers['Authorization'] = authHeader;
      }

      // 重试请求
      final response = await _dio.fetch(options);
      handler.resolve(response);
    } catch (e) {
      handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          error: e,
        ),
      );
    }
  }
}
