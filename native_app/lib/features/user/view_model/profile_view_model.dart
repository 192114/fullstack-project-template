import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';
import 'package:native_app/features/user/models/user_model.dart';

import 'user_provider.dart';

part 'profile_view_model.freezed.dart';

@freezed
abstract class ProfileState with _$ProfileState {
  const factory ProfileState({
    UserModel? user,
    @Default(false) bool isLoading,
    @Default(false) bool isEditing,
    @Default(false) bool isSaving,
    String? errorMessage,
  }) = _ProfileState;
}

class ProfileViewModel extends Notifier<ProfileState> {
  @override
  ProfileState build() {
    _loadUser();
    return const ProfileState(isLoading: true);
  }

  /// 加载当前用户信息
  Future<void> _loadUser() async {
    try {
      final user = await ref.read(authRepositoryProvider).getCurrentUser();
      state = state.copyWith(user: user, isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: '未知错误，请稍后重试');
    }
  }

  /// 切换编辑模式
  void toggleEditMode() {
    state = state.copyWith(isEditing: !state.isEditing);
  }

  /// 更新个人资料
  Future<bool> updateProfile(UpdateProfileRequest request) async {
    state = state.copyWith(isSaving: true, errorMessage: null);
    try {
      final user =
          await ref.read(userRepositoryProvider).updateProfile(request);
      state = state.copyWith(
        user: user,
        isSaving: false,
        isEditing: false,
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isSaving: false, errorMessage: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isSaving: false, errorMessage: '未知错误，请稍后重试');
      return false;
    }
  }

  /// 退出登录
  Future<void> logout() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (e) {
      // 即使退出失败也清除本地状态
      state = state.copyWith(errorMessage: '退出登录失败');
    }
  }
}
