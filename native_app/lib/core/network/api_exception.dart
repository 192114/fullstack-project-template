import 'package:dio/dio.dart';

/// API 异常类型
enum ApiExceptionType {
  /// 网络连接异常
  network,
  /// 请求超时
  timeout,
  /// 未授权 (401)
  unauthorized,
  /// 服务器错误 (5xx)
  server,
  /// 请求被取消
  cancelled,
  /// 未知异常
  unknown,
}

/// 统一 API 异常类
class ApiException implements Exception {
  /// 错误码
  final int? code;

  /// 错误信息
  final String message;

  /// 错误数据
  final dynamic data;

  /// 异常类型
  final ApiExceptionType type;

  const ApiException({
    this.code,
    required this.message,
    this.data,
    this.type = ApiExceptionType.unknown,
  });

  @override
  String toString() {
    return 'ApiException(code: $code, message: $message, type: $type)';
  }

  /// 从 DioException 创建
  factory ApiException.fromDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          type: ApiExceptionType.timeout,
          message: '连接超时，请检查网络后重试',
        );
      case DioExceptionType.connectionError:
        return ApiException(
          type: ApiExceptionType.network,
          message: '网络连接失败，请检查网络设置',
        );
      case DioExceptionType.badResponse:
        return _handleBadResponse(error.response);
      case DioExceptionType.cancel:
        return ApiException(
          type: ApiExceptionType.cancelled,
          message: '请求已取消',
        );
      default:
        return ApiException(
          type: ApiExceptionType.unknown,
          message: '未知错误: ${error.message}',
        );
    }
  }

  /// 处理 HTTP 错误响应
  static ApiException _handleBadResponse(Response? response) {
    final statusCode = response?.statusCode ?? 0;
    final data = response?.data;

    // 优先从响应体中提取业务 code 和 message
    final business = _extractBusinessInfo(data);
    final bizCode = business?['code'] as int?;
    final bizMessage = business?['message'] as String?;

    switch (statusCode) {
      case 400:
        // 参数校验异常：优先使用响应体中的具体错误信息
        return ApiException(
          code: bizCode ?? 400,
          type: ApiExceptionType.unknown,
          message: bizMessage ?? '请求参数错误',
          data: data,
        );
      case 401:
        return ApiException(
          code: 401,
          type: ApiExceptionType.unauthorized,
          message: bizMessage ?? '登录已过期，请重新登录',
          data: data,
        );
      case 403:
        return ApiException(
          code: 403,
          type: ApiExceptionType.unauthorized,
          message: bizMessage ?? '没有访问权限',
          data: data,
        );
      case 404:
        return ApiException(
          code: 404,
          type: ApiExceptionType.unknown,
          message: bizMessage ?? '请求的资源不存在',
          data: data,
        );
      case >= 500:
        return ApiException(
          code: statusCode,
          type: ApiExceptionType.server,
          message: bizMessage ?? '服务器错误 ($statusCode)',
          data: data,
        );
      default:
        return ApiException(
          code: statusCode,
          type: ApiExceptionType.unknown,
          message: bizMessage ?? '请求失败 ($statusCode)',
          data: data,
        );
    }
  }

  /// 从响应体中提取业务 code 和 message
  /// 兼容后端 Result 包装类: {"code": 10004, "msg": "...", "data": null}
  static Map<String, dynamic>? _extractBusinessInfo(dynamic data) {
    if (data is Map) {
      final code = data['code'];
      final message = data['msg'] ?? data['message'];
      if (code != null && message is String) {
        return {'code': code is int ? code : int.tryParse(code.toString()), 'message': message};
      }
    }
    return null;
  }
}
