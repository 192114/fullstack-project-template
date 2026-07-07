import 'package:dio/dio.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/core/network/dio_client.dart';

/// 用户远程数据源
/// 封装用户相关 API 调用
class UserRemoteDataSource {
  final DioClient _dioClient;

  UserRemoteDataSource(this._dioClient);

  /// 更新个人资料
  Future<Map<String, dynamic>> updateProfile({
    String? nickname,
    String? email,
    String? avatar,
  }) async {
    final response = await _dioClient.put(
      '/app/users/profile',
      data: {
        'nickname': ?nickname,
        'email': ?email,
        'avatar': ?avatar,
      },
    );
    return _parseResponseData(response);
  }

  /// 修改密码
  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _dioClient.put(
      '/app/users/password',
      data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      },
    );
  }

  /// 解析响应数据
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
