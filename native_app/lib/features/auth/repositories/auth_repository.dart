import 'package:native_app/features/auth/models/auth_models.dart';
import 'package:native_app/features/user/models/user_model.dart';

/// 认证仓库抽象接口
abstract class AuthRepository {
  /// 发送验证码
  Future<void> sendCode(String phone, String scene);

  /// 密码登录
  Future<LoginResponse> loginByPassword(String phone, String password);

  /// 验证码登录
  Future<LoginResponse> loginBySms(String phone, String code);

  /// 注册（返回 RegisterResponse，不含 Token）
  Future<RegisterResponse> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  });

  /// 刷新 Token
  Future<RefreshTokenResponse> refreshToken(String refreshToken);

  /// 退出登录
  Future<void> logout();

  /// 获取当前用户信息
  Future<UserModel> getCurrentUser();

  /// 重置密码
  Future<void> resetPassword(
    String phone,
    String newPassword,
    String code,
  );

  /// 查询审核状态
  Future<AuditStatusResponse> getAuditStatus(String phone);

  /// 驳回后重新提交审核
  Future<RegisterResponse> resubmit(
    String phone,
    String password,
    String code, {
    String? nickname,
  });
}
