import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';

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
    try {
      await ref
          .read(authRepositoryProvider)
          .resetPassword(phone, newPassword, code);
      state = state.copyWith(
        isLoading: false,
        successMessage: '密码重置成功，请重新登录',
      );
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
