import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';

import 'auth_provider.dart';

part 'resubmit_view_model.freezed.dart';

@freezed
abstract class ResubmitState with _$ResubmitState {
  const factory ResubmitState({
    @Default(false) bool isLoading,
    @Default(false) bool isSubmitting,
    String? nickname,
    String? errorMessage,
  }) = _ResubmitState;
}

class ResubmitViewModel extends Notifier<ResubmitState> {
  @override
  ResubmitState build() => const ResubmitState();

  /// 加载审核信息，预填昵称
  Future<void> loadAuditInfo(String phone) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response =
          await ref.read(authRepositoryProvider).getAuditStatus(phone);
      state = state.copyWith(
        isLoading: false,
        nickname: response.nickname,
      );
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: '未知错误，请稍后重试');
    }
  }

  /// 重新提交审核
  /// 返回手机号表示提交成功，返回 null 表示失败
  Future<String?> resubmit(
    String phone,
    String password,
    String code, {
    String? nickname,
  }) async {
    state = state.copyWith(isSubmitting: true, errorMessage: null);
    try {
      await ref
          .read(authRepositoryProvider)
          .resubmit(phone, password, code, nickname: nickname);
      state = state.copyWith(isSubmitting: false);
      return phone;
    } on ApiException catch (e) {
      state = state.copyWith(isSubmitting: false, errorMessage: e.message);
      return null;
    } catch (e) {
      state =
          state.copyWith(isSubmitting: false, errorMessage: '未知错误，请稍后重试');
      return null;
    }
  }
}
