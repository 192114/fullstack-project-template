import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// 后端 JacksonConfig 将 Long 序列化为 String，需兼容解析
int _parseId(dynamic value) {
  if (value is int) return value;
  if (value is String) return int.parse(value);
  throw ArgumentError('Cannot parse id: $value');
}

/// 用户模型
@freezed
abstract class UserModel with _$UserModel {
  const factory UserModel({
    @JsonKey(fromJson: _parseId) required int id,
    required String phone,
    String? username,
    String? nickname,
    String? avatar,
    String? email,
    required int status,
    int? auditStatus,
    String? auditRemark,
    String? auditTime,
    String? createTime,
    String? updateTime,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

/// 更新个人资料请求
@freezed
abstract class UpdateProfileRequest with _$UpdateProfileRequest {
  const factory UpdateProfileRequest({
    String? nickname,
    String? email,
    String? avatar,
  }) = _UpdateProfileRequest;

  factory UpdateProfileRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateProfileRequestFromJson(json);
}

/// 修改密码请求
@freezed
abstract class ChangePasswordRequest with _$ChangePasswordRequest {
  const factory ChangePasswordRequest({
    required String oldPassword,
    required String newPassword,
  }) = _ChangePasswordRequest;

  factory ChangePasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$ChangePasswordRequestFromJson(json);
}
