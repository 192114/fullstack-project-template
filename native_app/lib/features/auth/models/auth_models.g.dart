// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LoginResponse _$LoginResponseFromJson(Map<String, dynamic> json) =>
    _LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LoginResponseToJson(_LoginResponse instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'user': instance.user,
    };

_RefreshTokenResponse _$RefreshTokenResponseFromJson(
  Map<String, dynamic> json,
) => _RefreshTokenResponse(
  accessToken: json['accessToken'] as String,
  refreshToken: json['refreshToken'] as String,
);

Map<String, dynamic> _$RefreshTokenResponseToJson(
  _RefreshTokenResponse instance,
) => <String, dynamic>{
  'accessToken': instance.accessToken,
  'refreshToken': instance.refreshToken,
};

_SendCodeRequest _$SendCodeRequestFromJson(Map<String, dynamic> json) =>
    _SendCodeRequest(
      phone: json['phone'] as String,
      scene: json['scene'] as String,
    );

Map<String, dynamic> _$SendCodeRequestToJson(_SendCodeRequest instance) =>
    <String, dynamic>{'phone': instance.phone, 'scene': instance.scene};

_PasswordLoginRequest _$PasswordLoginRequestFromJson(
  Map<String, dynamic> json,
) => _PasswordLoginRequest(
  phone: json['phone'] as String,
  password: json['password'] as String,
);

Map<String, dynamic> _$PasswordLoginRequestToJson(
  _PasswordLoginRequest instance,
) => <String, dynamic>{'phone': instance.phone, 'password': instance.password};

_SmsLoginRequest _$SmsLoginRequestFromJson(Map<String, dynamic> json) =>
    _SmsLoginRequest(
      phone: json['phone'] as String,
      code: json['code'] as String,
    );

Map<String, dynamic> _$SmsLoginRequestToJson(_SmsLoginRequest instance) =>
    <String, dynamic>{'phone': instance.phone, 'code': instance.code};

_RegisterRequest _$RegisterRequestFromJson(Map<String, dynamic> json) =>
    _RegisterRequest(
      phone: json['phone'] as String,
      password: json['password'] as String,
      code: json['code'] as String,
      nickname: json['nickname'] as String?,
    );

Map<String, dynamic> _$RegisterRequestToJson(_RegisterRequest instance) =>
    <String, dynamic>{
      'phone': instance.phone,
      'password': instance.password,
      'code': instance.code,
      'nickname': instance.nickname,
    };

_RefreshTokenRequest _$RefreshTokenRequestFromJson(Map<String, dynamic> json) =>
    _RefreshTokenRequest(refreshToken: json['refreshToken'] as String);

Map<String, dynamic> _$RefreshTokenRequestToJson(
  _RefreshTokenRequest instance,
) => <String, dynamic>{'refreshToken': instance.refreshToken};

_ResetPasswordRequest _$ResetPasswordRequestFromJson(
  Map<String, dynamic> json,
) => _ResetPasswordRequest(
  phone: json['phone'] as String,
  newPassword: json['newPassword'] as String,
  code: json['code'] as String,
);

Map<String, dynamic> _$ResetPasswordRequestToJson(
  _ResetPasswordRequest instance,
) => <String, dynamic>{
  'phone': instance.phone,
  'newPassword': instance.newPassword,
  'code': instance.code,
};
