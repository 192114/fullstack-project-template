import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/async_action.dart';

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
    final result = await runAsyncAction(
      () => ref.read(authRepositoryProvider).getAuditStatus(phone),
    );
    state = state.copyWith(
      isLoading: false,
      nickname: result.data?.nickname ?? state.nickname,
      errorMessage: result.errorMessage,
    );
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
    final result = await runAsyncAction(
      () => ref
          .read(authRepositoryProvider)
          .resubmit(phone, password, code, nickname: nickname),
    );
    state = state.copyWith(isSubmitting: false, errorMessage: result.errorMessage);
    return result.success ? phone : null;
  }
}
