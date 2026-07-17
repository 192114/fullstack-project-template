import 'package:native_app/core/network/token_manager.dart';
import 'package:native_app/features/user/models/user_model.dart';

import '../datasources/auth_remote_datasource.dart';
import '../models/auth_models.dart';
import 'auth_repository.dart';

/// 认证仓库实现
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final TokenManager _tokenManager;

  AuthRepositoryImpl({
    required this._remoteDataSource,
    required this._tokenManager,
  });

  @override
  Future<void> sendCode(String phone, String scene) async {
    await _remoteDataSource.sendCode(phone, scene);
  }

  @override
  Future<LoginResponse> loginByPassword(String phone, String password) async {
    final data = await _remoteDataSource.loginByPassword(phone, password);
    return await _handleLoginResponse(data);
  }

  @override
  Future<LoginResponse> loginBySms(String phone, String code) async {
    final data = await _remoteDataSource.loginBySms(phone, code);
    return await _handleLoginResponse(data);
  }

  @override
  Future<RegisterResponse> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    final data = await _remoteDataSource.register(
      phone,
      password,
      code,
      nickname: nickname,
    );
    return RegisterResponse.fromJson(data);
  }

  @override
  Future<RefreshTokenResponse> refreshToken(String refreshToken) async {
    final data = await _remoteDataSource.refreshToken(refreshToken);
    final response = RefreshTokenResponse.fromJson(data);
    await _tokenManager.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
    return response;
  }

  @override
  Future<void> logout() async {
    try {
      await _remoteDataSource.logout();
    } finally {
      await _tokenManager.clearTokens();
    }
  }

  @override
  Future<UserModel> getCurrentUser() async {
    final data = await _remoteDataSource.getCurrentUser();
    return UserModel.fromJson(data);
  }

  @override
  Future<void> resetPassword(
    String phone,
    String newPassword,
    String code,
  ) async {
    await _remoteDataSource.resetPassword(phone, newPassword, code);
  }

  @override
  Future<AuditStatusResponse> getAuditStatus(String phone) async {
    final data = await _remoteDataSource.getAuditStatus(phone);
    return AuditStatusResponse.fromJson(data);
  }

  @override
  Future<RegisterResponse> resubmit(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    final data = await _remoteDataSource.resubmit(
      phone,
      password,
      code,
      nickname: nickname,
    );
    return RegisterResponse.fromJson(data);
  }

  /// 处理登录响应，保存双 Token
  Future<LoginResponse> _handleLoginResponse(Map<String, dynamic> data) async {
    final response = LoginResponse.fromJson(data);
    await _tokenManager.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
    return response;
  }
}
