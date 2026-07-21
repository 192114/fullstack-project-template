import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/async_action.dart';

import 'auth_provider.dart';

part 'login_view_model.freezed.dart';

@freezed
abstract class LoginState with _$LoginState {
  const factory LoginState({
    @Default(false) bool isLoading,
    String? errorMessage,
    int? errorCode,
  }) = _LoginState;
}

class LoginViewModel extends Notifier<LoginState> {
  @override
  LoginState build() => const LoginState();

  /// 密码登录
  /// 返回 true 表示登录成功
  Future<bool> loginByPassword(String phone, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null, errorCode: null);
    final result = await runAsyncAction(
      () => ref.read(authRepositoryProvider).loginByPassword(phone, password),
    );
    state = state.copyWith(
      isLoading: false,
      errorMessage: result.errorMessage,
      errorCode: result.errorCode,
    );
    return result.success;
  }

  /// 验证码登录
  /// 返回 true 表示登录成功
  Future<bool> loginBySms(String phone, String code) async {
    state = state.copyWith(isLoading: true, errorMessage: null, errorCode: null);
    final result = await runAsyncAction(
      () => ref.read(authRepositoryProvider).loginBySms(phone, code),
    );
    state = state.copyWith(
      isLoading: false,
      errorMessage: result.errorMessage,
      errorCode: result.errorCode,
    );
    return result.success;
  }
}
