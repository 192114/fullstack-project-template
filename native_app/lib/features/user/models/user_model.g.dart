// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_UserModel _$UserModelFromJson(Map<String, dynamic> json) => _UserModel(
  id: _parseId(json['id']),
  phone: json['phone'] as String,
  username: json['username'] as String?,
  nickname: json['nickname'] as String?,
  avatar: json['avatar'] as String?,
  email: json['email'] as String?,
  status: (json['status'] as num).toInt(),
  auditStatus: (json['auditStatus'] as num?)?.toInt(),
  auditRemark: json['auditRemark'] as String?,
  auditTime: json['auditTime'] as String?,
  createTime: json['createTime'] as String?,
  updateTime: json['updateTime'] as String?,
);

Map<String, dynamic> _$UserModelToJson(_UserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'phone': instance.phone,
      'username': instance.username,
      'nickname': instance.nickname,
      'avatar': instance.avatar,
      'email': instance.email,
      'status': instance.status,
      'auditStatus': instance.auditStatus,
      'auditRemark': instance.auditRemark,
      'auditTime': instance.auditTime,
      'createTime': instance.createTime,
      'updateTime': instance.updateTime,
    };

_UpdateProfileRequest _$UpdateProfileRequestFromJson(
  Map<String, dynamic> json,
) => _UpdateProfileRequest(
  nickname: json['nickname'] as String?,
  email: json['email'] as String?,
  avatar: json['avatar'] as String?,
);

Map<String, dynamic> _$UpdateProfileRequestToJson(
  _UpdateProfileRequest instance,
) => <String, dynamic>{
  'nickname': instance.nickname,
  'email': instance.email,
  'avatar': instance.avatar,
};

_ChangePasswordRequest _$ChangePasswordRequestFromJson(
  Map<String, dynamic> json,
) => _ChangePasswordRequest(
  oldPassword: json['oldPassword'] as String,
  newPassword: json['newPassword'] as String,
);

Map<String, dynamic> _$ChangePasswordRequestToJson(
  _ChangePasswordRequest instance,
) => <String, dynamic>{
  'oldPassword': instance.oldPassword,
  'newPassword': instance.newPassword,
};
