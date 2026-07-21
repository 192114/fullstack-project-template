import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/async_action.dart';

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
  /// 返回手机号表示注册成功（需跳转审核页），返回 null 表示失败
  Future<String?> register(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    final result = await runAsyncAction(
      () => ref
          .read(authRepositoryProvider)
          .register(phone, password, code, nickname: nickname),
    );
    state = state.copyWith(isLoading: false, errorMessage: result.errorMessage);
    return result.success ? phone : null;
  }
}
