import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:native_app/core/network/api_exception.dart';

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
    try {
      final response = await ref.read(authRepositoryProvider).getAuditStatus(phone);
      state = state.copyWith(
        isLoading: false,
        auditStatus: response.auditStatus,
        auditRemark: response.auditRemark,
        nickname: response.nickname,
        phone: response.phone,
        createTime: response.createTime,
      );
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: '未知错误，请稍后重试');
    }
  }
}
