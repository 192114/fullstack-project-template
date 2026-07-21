import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/async_action.dart';

import 'auth_provider.dart';

part 'reset_password_view_model.freezed.dart';

@freezed
abstract class ResetPasswordState with _$ResetPasswordState {
  const factory ResetPasswordState({
    @Default(false) bool isLoading,
    String? successMessage,
    String? errorMessage,
  }) = _ResetPasswordState;
}

class ResetPasswordViewModel extends Notifier<ResetPasswordState> {
  @override
  ResetPasswordState build() => const ResetPasswordState();

  /// 重置密码
  /// 返回 true 表示重置成功
  Future<bool> resetPassword(
    String phone,
    String newPassword,
    String code,
  ) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    final result = await runAsyncAction(
      () => ref
          .read(authRepositoryProvider)
          .resetPassword(phone, newPassword, code),
    );
    state = state.copyWith(
      isLoading: false,
      errorMessage: result.errorMessage,
      successMessage: result.success ? '密码重置成功，请重新登录' : null,
    );
    return result.success;
  }
}
