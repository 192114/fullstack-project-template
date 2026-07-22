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

  const user = UserModel(id: 1, phone: '13800138000', status: 1, auditStatus: 0);

  test('on success, returns the phone and clears error', () async {
    fakeAuthRepository.registerResponse = const RegisterResponse(user: user);

    final notifier = container.read(registerViewModelProvider.notifier);
    final result = await notifier.register(
      '13800138000',
      'password1',
      '123456',
      nickname: 'tester',
    );

    expect(result, '13800138000');
    final state = container.read(registerViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.errorMessage, isNull);
  });

  test('on phone already registered, returns null with message', () async {
    fakeAuthRepository.errorToThrow = const ApiException(
      code: 10011,
      message: '手机号已注册',
    );

    final notifier = container.read(registerViewModelProvider.notifier);
    final result = await notifier.register('13800138000', 'password1', '123456');

    expect(result, isNull);
    expect(container.read(registerViewModelProvider).errorMessage, '手机号已注册');
  });
}
