import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/models/auth_models.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';
import 'package:native_app/features/user/models/user_model.dart';

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

  group('loadAuditInfo', () {
    test('on success, prefills nickname', () async {
      fakeAuthRepository.auditStatusResponse = const AuditStatusResponse(
        auditStatus: 2,
        auditRemark: '资料不完整',
        nickname: 'tester',
      );

      final notifier = container.read(resubmitViewModelProvider.notifier);
      await notifier.loadAuditInfo('13800138000');

      final state = container.read(resubmitViewModelProvider);
      expect(state.isLoading, isFalse);
      expect(state.nickname, 'tester');
      expect(state.errorMessage, isNull);
    });

    test('on failure, keeps previous nickname and sets errorMessage', () async {
      fakeAuthRepository.auditStatusResponse = const AuditStatusResponse(
        auditStatus: 2,
        nickname: 'tester',
      );
      final notifier = container.read(resubmitViewModelProvider.notifier);
      await notifier.loadAuditInfo('13800138000');

      fakeAuthRepository.errorToThrow = const ApiException(
        code: 10010,
        message: '手机号未注册',
      );
      await notifier.loadAuditInfo('13800138000');

      final state = container.read(resubmitViewModelProvider);
      expect(state.nickname, 'tester');
      expect(state.errorMessage, '手机号未注册');
    });
  });

  group('resubmit', () {
    const user = UserModel(id: 1, phone: '13800138000', status: 1, auditStatus: 0);

    test('on success, returns phone', () async {
      fakeAuthRepository.registerResponse = const RegisterResponse(user: user);

      final notifier = container.read(resubmitViewModelProvider.notifier);
      final result = await notifier.resubmit('13800138000', 'newpassword1', '123456');

      expect(result, '13800138000');
      final state = container.read(resubmitViewModelProvider);
      expect(state.isSubmitting, isFalse);
      expect(state.errorMessage, isNull);
    });

    test('on not-rejected status, returns null with message', () async {
      fakeAuthRepository.errorToThrow = const ApiException(
        code: 10020,
        message: '当前状态不允许重新提交，仅审核驳回后可操作',
      );

      final notifier = container.read(resubmitViewModelProvider.notifier);
      final result = await notifier.resubmit('13800138000', 'newpassword1', '123456');

      expect(result, isNull);
      expect(
        container.read(resubmitViewModelProvider).errorMessage,
        '当前状态不允许重新提交，仅审核驳回后可操作',
      );
    });
  });
}
