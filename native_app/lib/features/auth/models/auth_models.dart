import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/features/user/models/user_model.dart';

part 'auth_models.freezed.dart';
part 'auth_models.g.dart';

/// 登录响应
@freezed
abstract class LoginResponse with _$LoginResponse {
  const factory LoginResponse({
    required String accessToken,
    required String refreshToken,
    required UserModel user,
  }) = _LoginResponse;

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);
}

/// 刷新 Token 响应
@freezed
abstract class RefreshTokenResponse with _$RefreshTokenResponse {
  const factory RefreshTokenResponse({
    required String accessToken,
    required String refreshToken,
  }) = _RefreshTokenResponse;

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) =>
      _$RefreshTokenResponseFromJson(json);
}

/// 发送验证码请求
@freezed
abstract class SendCodeRequest with _$SendCodeRequest {
  const factory SendCodeRequest({
    required String phone,
    required String scene,
  }) = _SendCodeRequest;

  factory SendCodeRequest.fromJson(Map<String, dynamic> json) =>
      _$SendCodeRequestFromJson(json);
}

/// 密码登录请求
@freezed
abstract class PasswordLoginRequest with _$PasswordLoginRequest {
  const factory PasswordLoginRequest({
    required String phone,
    required String password,
  }) = _PasswordLoginRequest;

  factory PasswordLoginRequest.fromJson(Map<String, dynamic> json) =>
      _$PasswordLoginRequestFromJson(json);
}

/// 验证码登录请求
@freezed
abstract class SmsLoginRequest with _$SmsLoginRequest {
  const factory SmsLoginRequest({
    required String phone,
    required String code,
  }) = _SmsLoginRequest;

  factory SmsLoginRequest.fromJson(Map<String, dynamic> json) =>
      _$SmsLoginRequestFromJson(json);
}

/// 注册请求
@freezed
abstract class RegisterRequest with _$RegisterRequest {
  const factory RegisterRequest({
    required String phone,
    required String password,
    required String code,
    String? nickname,
  }) = _RegisterRequest;

  factory RegisterRequest.fromJson(Map<String, dynamic> json) =>
      _$RegisterRequestFromJson(json);
}

/// 刷新 Token 请求
@freezed
abstract class RefreshTokenRequest with _$RefreshTokenRequest {
  const factory RefreshTokenRequest({
    required String refreshToken,
  }) = _RefreshTokenRequest;

  factory RefreshTokenRequest.fromJson(Map<String, dynamic> json) =>
      _$RefreshTokenRequestFromJson(json);
}

/// 重置密码请求
@freezed
abstract class ResetPasswordRequest with _$ResetPasswordRequest {
  const factory ResetPasswordRequest({
    required String phone,
    required String newPassword,
    required String code,
  }) = _ResetPasswordRequest;

  factory ResetPasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$ResetPasswordRequestFromJson(json);
}

/// 注册响应（不含 Token，仅返回用户信息）
@freezed
abstract class RegisterResponse with _$RegisterResponse {
  const factory RegisterResponse({
    required UserModel user,
  }) = _RegisterResponse;

  factory RegisterResponse.fromJson(Map<String, dynamic> json) =>
      _$RegisterResponseFromJson(json);
}

/// 审核状态查询响应
@freezed
abstract class AuditStatusResponse with _$AuditStatusResponse {
  const factory AuditStatusResponse({
    required int auditStatus,
    String? auditRemark,
    String? nickname,
    String? phone,
    String? createTime,
  }) = _AuditStatusResponse;

  factory AuditStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$AuditStatusResponseFromJson(json);
}

/// 重新提交审核请求
@freezed
abstract class ResubmitRequest with _$ResubmitRequest {
  const factory ResubmitRequest({
    required String phone,
    required String password,
    required String code,
    String? nickname,
  }) = _ResubmitRequest;

  factory ResubmitRequest.fromJson(Map<String, dynamic> json) =>
      _$ResubmitRequestFromJson(json);
}
