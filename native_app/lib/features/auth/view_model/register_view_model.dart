import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';

import 'auth_provider.dart';

part 'register_view_model.freezed.dart';

@freezed
abstract class RegisterState with _$RegisterState {
  const factory RegisterState({
    @Default(false) bool isLoading,
    String? errorMessage,
  }) = _RegisterState;
}

class RegisterViewModel extends Notifier<RegisterState> {
  @override
  RegisterState build() => const RegisterState();

  /// 注册
  /// 返回 true 表示注册成功（自动登录）
  Future<bool> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await ref
          .read(authRepositoryProvider)
          .register(phone, password, code, nickname: nickname);
      state = state.copyWith(isLoading: false);
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: '未知错误，请稍后重试');
      return false;
    }
  }
}
