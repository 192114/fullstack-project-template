import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/async_action.dart';

import 'auth_provider.dart';

part 'account_review_view_model.freezed.dart';

@freezed
abstract class AccountReviewState with _$AccountReviewState {
  const factory AccountReviewState({
    @Default(false) bool isLoading,
    @Default(0) int auditStatus,
    String? auditRemark,
    String? nickname,
    String? phone,
    String? createTime,
    String? errorMessage,
  }) = _AccountReviewState;
}

class AccountReviewViewModel extends Notifier<AccountReviewState> {
  @override
  AccountReviewState build() => const AccountReviewState();

  /// 查询审核状态
  Future<void> refresh(String phone) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    final result = await runAsyncAction(
      () => ref.read(authRepositoryProvider).getAuditStatus(phone),
    );
    final response = result.data;
    state = state.copyWith(
      isLoading: false,
      errorMessage: result.errorMessage,
      auditStatus: response?.auditStatus ?? state.auditStatus,
      auditRemark: response?.auditRemark ?? state.auditRemark,
      nickname: response?.nickname ?? state.nickname,
      phone: response?.phone ?? state.phone,
      createTime: response?.createTime ?? state.createTime,
    );
  }
}
