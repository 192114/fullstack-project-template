import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';
import '../models/user_model.dart';

import 'user_provider.dart';

part 'change_password_view_model.freezed.dart';

@freezed
abstract class ChangePasswordState with _$ChangePasswordState {
  const factory ChangePasswordState({
    @Default(false) bool isLoading,
    String? successMessage,
    String? errorMessage,
  }) = _ChangePasswordState;
}

class ChangePasswordViewModel extends Notifier<ChangePasswordState> {
  @override
  ChangePasswordState build() => const ChangePasswordState();

  /// 修改密码
  /// 返回 true 表示修改成功
  Future<bool> changePassword(String oldPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await ref
          .read(userRepositoryProvider)
          .changePassword(ChangePasswordRequest(
            oldPassword: oldPassword,
            newPassword: newPassword,
          ));
      state = state.copyWith(
        isLoading: false,
        successMessage: '密码修改成功',
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
