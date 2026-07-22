import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
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

  test('on success, sets successMessage and clears errorMessage', () async {
    final notifier = container.read(resetPasswordViewModelProvider.notifier);
    final result = await notifier.resetPassword('13800138000', 'newpassword1', '123456');

    expect(result, isTrue);
    final state = container.read(resetPasswordViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.successMessage, '密码重置成功，请重新登录');
    expect(state.errorMessage, isNull);
  });

  test('on failure, sets errorMessage and leaves successMessage unset', () async {
    fakeAuthRepository.errorToThrow = const ApiException(
      code: 10012,
      message: '验证码已过期，请重新获取',
    );

    final notifier = container.read(resetPasswordViewModelProvider.notifier);
    final result = await notifier.resetPassword('13800138000', 'newpassword1', 'expired');

    expect(result, isFalse);
    final state = container.read(resetPasswordViewModelProvider);
    expect(state.errorMessage, '验证码已过期，请重新获取');
    expect(state.successMessage, isNull);
  });
}
