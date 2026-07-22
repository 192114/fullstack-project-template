import 'package:native_app/features/auth/models/auth_models.dart';
import 'package:native_app/features/auth/repositories/auth_repository.dart';
import 'package:native_app/features/user/models/user_model.dart';

/// [AuthRepository] 的手写 Fake 实现，供 ViewModel 状态测试使用。
///
/// 按需设置对应的 `*Response` 字段模拟成功返回；设置 [errorToThrow] 模拟任意方法失败。
class FakeAuthRepository implements AuthRepository {
  LoginResponse? loginResponse;
  RegisterResponse? registerResponse;
  RefreshTokenResponse? refreshTokenResponse;
  UserModel? currentUser;
  AuditStatusResponse? auditStatusResponse;
  Object? errorToThrow;

  bool logoutCalled = false;
  String? lastSentCodePhone;

  @override
  Future<void> sendCode(String phone, String scene) async {
    if (errorToThrow != null) throw errorToThrow!;
    lastSentCodePhone = phone;
  }

  @override
  Future<LoginResponse> loginByPassword(String phone, String password) async {
    if (errorToThrow != null) throw errorToThrow!;
    return loginResponse!;
  }

  @override
  Future<LoginResponse> loginBySms(String phone, String code) async {
    if (errorToThrow != null) throw errorToThrow!;
    return loginResponse!;
  }

  @override
  Future<RegisterResponse> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    if (errorToThrow != null) throw errorToThrow!;
    return registerResponse!;
  }

  @override
  Future<RefreshTokenResponse> refreshToken(String refreshToken) async {
    if (errorToThrow != null) throw errorToThrow!;
    return refreshTokenResponse!;
  }

  @override
  Future<void> logout() async {
    if (errorToThrow != null) throw errorToThrow!;
    logoutCalled = true;
  }

  @override
  Future<UserModel> getCurrentUser() async {
    if (errorToThrow != null) throw errorToThrow!;
    return currentUser!;
  }

  @override
  Future<void> resetPassword(
    String phone,
    String newPassword,
    String code,
  ) async {
    if (errorToThrow != null) throw errorToThrow!;
  }

  @override
  Future<AuditStatusResponse> getAuditStatus(String phone) async {
    if (errorToThrow != null) throw errorToThrow!;
    return auditStatusResponse!;
  }

  @override
  Future<RegisterResponse> resubmit(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    if (errorToThrow != null) throw errorToThrow!;
    return registerResponse!;
  }
}
