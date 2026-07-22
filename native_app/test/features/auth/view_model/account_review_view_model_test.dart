import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/models/auth_models.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';

import '../../../support/fake_auth_repository.dart';

void main() {
  late FakeAuthRepository fakeAuthRepository;
  late ProviderContainer container;

  setUp(() {
    fakeAuthRepository = FakeAuthRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(fakeAuthRepository),
      ],
    );
    addTearDown(container.dispose);
  });

  test('on success, populates all audit fields', () async {
    fakeAuthRepository.auditStatusResponse = const AuditStatusResponse(
      auditStatus: 1,
      nickname: 'tester',
      phone: '13800138000',
      createTime: '2026-01-01 10:00:00',
    );

    final notifier = container.read(accountReviewViewModelProvider.notifier);
    await notifier.refresh('13800138000');

    final state = container.read(accountReviewViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.auditStatus, 1);
    expect(state.nickname, 'tester');
    expect(state.phone, '13800138000');
    expect(state.createTime, '2026-01-01 10:00:00');
    expect(state.errorMessage, isNull);
  });

  test('on rejected status, exposes auditRemark', () async {
    fakeAuthRepository.auditStatusResponse = const AuditStatusResponse(
      auditStatus: 2,
      auditRemark: '资料不完整',
    );

    final notifier = container.read(accountReviewViewModelProvider.notifier);
    await notifier.refresh('13800138000');

    expect(container.read(accountReviewViewModelProvider).auditRemark, '资料不完整');
  });

  test('on failure, keeps previous audit fields and sets errorMessage', () async {
    fakeAuthRepository.auditStatusResponse = const AuditStatusResponse(
      auditStatus: 0,
      nickname: 'tester',
    );
    final notifier = container.read(accountReviewViewModelProvider.notifier);
    await notifier.refresh('13800138000');

    fakeAuthRepository.errorToThrow = const ApiException(
      code: 10010,
      message: '手机号未注册',
    );
    await notifier.refresh('13800138000');

    final state = container.read(accountReviewViewModelProvider);
    expect(state.auditStatus, 0);
    expect(state.nickname, 'tester');
    expect(state.errorMessage, '手机号未注册');
  });
}
