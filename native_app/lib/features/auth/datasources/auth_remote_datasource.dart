import 'package:dio/dio.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/core/network/dio_client.dart';

/// 认证远程数据源
/// 封装所有认证相关 API 调用
class AuthRemoteDataSource {
  final DioClient _dioClient;

  AuthRemoteDataSource(this._dioClient);

  /// 发送验证码
  Future<void> sendCode(String phone, String scene) async {
    await _dioClient.post(
      '/auth/send-code',
      data: {'phone': phone, 'scene': scene},
    );
  }

  /// 密码登录
  Future<Map<String, dynamic>> loginByPassword(
    String phone,
    String password,
  ) async {
    final response = await _dioClient.post(
      '/auth/login/password',
      data: {'phone': phone, 'password': password},
    );
    return _parseResponseData(response);
  }

  /// 验证码登录
  Future<Map<String, dynamic>> loginBySms(String phone, String code) async {
    final response = await _dioClient.post(
      '/auth/login/sms',
      data: {'phone': phone, 'code': code},
    );
    return _parseResponseData(response);
  }

  /// 注册
  Future<Map<String, dynamic>> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    final response = await _dioClient.post(
      '/auth/register',
      data: {
        'phone': phone,
        'password': password,
        'code': code,
        'nickname': ?nickname,
      },
    );
    return _parseResponseData(response);
  }

  /// 刷新 Token
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dioClient.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    return _parseResponseData(response);
  }

  /// 退出登录
  Future<void> logout() async {
    await _dioClient.post('/auth/logout');
  }

  /// 获取当前用户信息
  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _dioClient.get('/auth/me');
    return _parseResponseData(response);
  }

  /// 重置密码
  Future<void> resetPassword(
    String phone,
    String newPassword,
    String code,
  ) async {
    await _dioClient.post(
      '/auth/reset-password',
      data: {
        'phone': phone,
        'newPassword': newPassword,
        'code': code,
      },
    );
  }

  /// 解析响应数据
  /// 统一处理 Result<T> 格式，提取 data 字段
  Map<String, dynamic> _parseResponseData(Response<dynamic> response) {
    final body = response.data as Map<String, dynamic>;
    final code = body['code'] as int?;
    if (code != 200) {
      throw ApiException(
        code: code,
        message: body['msg'] as String? ?? '未知错误',
      );
    }
    return body['data'] as Map<String, dynamic>;
  }
}
