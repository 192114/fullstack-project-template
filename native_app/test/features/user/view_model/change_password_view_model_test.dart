import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/user/view_model/user_provider.dart';

import '../../../support/fake_user_repository.dart';

void main() {
  late FakeUserRepository fakeUserRepository;
  late ProviderContainer container;

  setUp(() {
    fakeUserRepository = FakeUserRepository();
    container = ProviderContainer(
      overrides: [
        userRepositoryProvider.overrideWithValue(fakeUserRepository),
      ],
    );
    addTearDown(container.dispose);
  });

  test('on success, sets successMessage and returns true', () async {
    final notifier = container.read(changePasswordViewModelProvider.notifier);
    final result = await notifier.changePassword('oldpassword1', 'newpassword1');

    expect(result, isTrue);
    final state = container.read(changePasswordViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.successMessage, '密码修改成功');
    expect(state.errorMessage, isNull);
  });

  test('on wrong old password, sets errorMessage and returns false', () async {
    fakeUserRepository.errorToThrow = const ApiException(
      code: 10005,
      message: '原密码不正确',
    );

    final notifier = container.read(changePasswordViewModelProvider.notifier);
    final result = await notifier.changePassword('wrong-old', 'newpassword1');

    expect(result, isFalse);
    final state = container.read(changePasswordViewModelProvider);
    expect(state.errorMessage, '原密码不正确');
    expect(state.successMessage, isNull);
  });

  test('on unknown error, surfaces generic message', () async {
    fakeUserRepository.errorToThrow = StateError('boom');

    final notifier = container.read(changePasswordViewModelProvider.notifier);
    final result = await notifier.changePassword('oldpassword1', 'newpassword1');

    expect(result, isFalse);
    expect(container.read(changePasswordViewModelProvider).errorMessage, '未知错误，请稍后重试');
  });
}
