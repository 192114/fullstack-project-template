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

  const user = UserModel(id: 1, phone: '13800138000', status: 1);

  group('loginByPassword', () {
    test('on success, clears error and returns true', () async {
      fakeAuthRepository.loginResponse = const LoginResponse(
        accessToken: 'access',
        refreshToken: 'refresh',
        user: user,
      );

      final notifier = container.read(loginViewModelProvider.notifier);
      final result = await notifier.loginByPassword('13800138000', 'password1');

      expect(result, isTrue);
      final state = container.read(loginViewModelProvider);
      expect(state.isLoading, isFalse);
      expect(state.errorMessage, isNull);
      expect(state.errorCode, isNull);
    });

    test('on ApiException, surfaces message and code, returns false', () async {
      fakeAuthRepository.errorToThrow = const ApiException(
        code: 10004,
        message: '手机号或密码错误',
      );

      final notifier = container.read(loginViewModelProvider.notifier);
      final result = await notifier.loginByPassword('13800138000', 'wrong-password');

      expect(result, isFalse);
      final state = container.read(loginViewModelProvider);
      expect(state.isLoading, isFalse);
      expect(state.errorMessage, '手机号或密码错误');
      expect(state.errorCode, 10004);
    });

    test('sets isLoading true while in flight', () async {
      fakeAuthRepository.loginResponse = const LoginResponse(
        accessToken: 'access',
        refreshToken: 'refresh',
        user: user,
      );

      final notifier = container.read(loginViewModelProvider.notifier);
      final future = notifier.loginByPassword('13800138000', 'password1');

      expect(container.read(loginViewModelProvider).isLoading, isTrue);
      await future;
      expect(container.read(loginViewModelProvider).isLoading, isFalse);
    });
  });

  group('loginBySms', () {
    test('on success, returns true', () async {
      fakeAuthRepository.loginResponse = const LoginResponse(
        accessToken: 'access',
        refreshToken: 'refresh',
        user: user,
      );

      final notifier = container.read(loginViewModelProvider.notifier);
      final result = await notifier.loginBySms('13800138000', '123456');

      expect(result, isTrue);
    });

    test('on unknown error, surfaces generic message', () async {
      fakeAuthRepository.errorToThrow = StateError('boom');

      final notifier = container.read(loginViewModelProvider.notifier);
      final result = await notifier.loginBySms('13800138000', '123456');

      expect(result, isFalse);
      expect(container.read(loginViewModelProvider).errorMessage, '未知错误，请稍后重试');
    });
  });
}
