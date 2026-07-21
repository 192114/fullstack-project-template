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

  /// 内部请求标记：跳过 Authorization 自动注入（用于刷新 Token 等请求，
  /// 避免被过期 Access Token 覆盖）
  static const _kSkipAuth = 'skipAuth';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // 内部请求（如刷新 Token）跳过 Authorization 自动注入
    if (options.extra[_kSkipAuth] != true) {
      final authHeader = _tokenManager.authorizationHeader;
      if (authHeader != null) {
        options.headers['Authorization'] = authHeader;
      }
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
          // 调用刷新 Token 接口；返回 null 表示成功，非空为失败原因
          final failureMessage = await _refreshToken();

          if (failureMessage == null) {
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
                error: ApiException(
                  code: 401,
                  type: ApiExceptionType.unauthorized,
                  message: failureMessage,
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
  ///
  /// 通过 refreshToken 调用 `/api/app/auth/refresh` 换取新的双 Token。
  /// 返回 `null` 表示刷新成功；返回非空字符串表示失败原因
  /// （优先透传后端 `msg`，如「刷新令牌无效或已过期」）。
  Future<String?> _refreshToken() async {
    try {
      final refreshToken = _tokenManager.refreshToken;
      if (refreshToken == null) return '登录已过期，请重新登录';

      final response = await _dio.post(
        '/app/auth/refresh',
        data: {'refreshToken': refreshToken},
        // 标记为内部请求，跳过 onRequest 中对 Authorization 的自动注入，
        // 避免过期的 Access Token 覆盖本次刷新请求
        options: Options(extra: const {_kSkipAuth: true}),
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data as Map<String, dynamic>;
        final code = body['code'] as int?;
        if (code == 200) {
          final data = body['data'] as Map<String, dynamic>?;
          final newAccessToken = data?['accessToken'] as String?;
          final newRefreshToken = data?['refreshToken'] as String?;
          if (newAccessToken != null) {
            await _tokenManager.saveTokens(
              accessToken: newAccessToken,
              refreshToken: newRefreshToken ?? refreshToken,
            );
            return null;
          }
        }
        // 业务失败：透传后端具体原因
        final msg = body['msg'] as String?;
        return (msg != null && msg.isNotEmpty) ? msg : '登录已过期，请重新登录';
      }
      return '登录已过期，请重新登录';
    } catch (e) {
      _logger.e('Refresh token failed: $e');
      return 'Token 刷新失败';
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
