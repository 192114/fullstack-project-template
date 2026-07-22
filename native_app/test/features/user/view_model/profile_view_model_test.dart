import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';
import 'package:native_app/features/user/models/user_model.dart';
import 'package:native_app/features/user/view_model/user_provider.dart';

import '../../../support/fake_auth_repository.dart';
import '../../../support/fake_user_repository.dart';

void main() {
  late FakeAuthRepository fakeAuthRepository;
  late FakeUserRepository fakeUserRepository;
  late ProviderContainer container;

  const user = UserModel(id: 1, phone: '13800138000', nickname: 'tester', status: 1);

  setUp(() {
    fakeAuthRepository = FakeAuthRepository()..currentUser = user;
    fakeUserRepository = FakeUserRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(fakeAuthRepository),
        userRepositoryProvider.overrideWithValue(fakeUserRepository),
      ],
    );
    addTearDown(container.dispose);
  });

  test('build() loads current user on init', () async {
    final initial = container.read(profileViewModelProvider);
    expect(initial.isLoading, isTrue);

    await Future<void>.delayed(Duration.zero);

    final state = container.read(profileViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.user, user);
    expect(state.errorMessage, isNull);
  });

  test('build() surfaces error when loading current user fails', () async {
    fakeAuthRepository.currentUser = null;
    fakeAuthRepository.errorToThrow = const ApiException(code: 401, message: '登录已过期，请重新登录');

    // Recreate the container so build() picks up the failing repository.
    final failingContainer = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(fakeAuthRepository),
        userRepositoryProvider.overrideWithValue(fakeUserRepository),
      ],
    );
    addTearDown(failingContainer.dispose);

    failingContainer.read(profileViewModelProvider);
    await Future<void>.delayed(Duration.zero);

    final state = failingContainer.read(profileViewModelProvider);
    expect(state.isLoading, isFalse);
    expect(state.errorMessage, '登录已过期，请重新登录');
  });

  test('toggleEditMode flips isEditing', () async {
    container.read(profileViewModelProvider);
    await Future<void>.delayed(Duration.zero);

    final notifier = container.read(profileViewModelProvider.notifier);
    notifier.toggleEditMode();

    expect(container.read(profileViewModelProvider).isEditing, isTrue);
  });

  group('updateProfile', () {
    test('on success, updates user and exits edit mode', () async {
      container.read(profileViewModelProvider);
      await Future<void>.delayed(Duration.zero);

      const updated = UserModel(id: 1, phone: '13800138000', nickname: 'new-name', status: 1);
      fakeUserRepository.updateProfileResponse = updated;

      final notifier = container.read(profileViewModelProvider.notifier);
      final result = await notifier.updateProfile(const UpdateProfileRequest(nickname: 'new-name'));

      expect(result, isTrue);
      final state = container.read(profileViewModelProvider);
      expect(state.user, updated);
      expect(state.isSaving, isFalse);
      expect(state.isEditing, isFalse);
    });

    test('on failure, sets errorMessage and keeps previous user', () async {
      container.read(profileViewModelProvider);
      await Future<void>.delayed(Duration.zero);

      fakeUserRepository.errorToThrow = const ApiException(code: 400, message: '昵称长度不能超过 64');

      final notifier = container.read(profileViewModelProvider.notifier);
      final result = await notifier.updateProfile(
        UpdateProfileRequest(nickname: 'x' * 100),
      );

      expect(result, isFalse);
      final state = container.read(profileViewModelProvider);
      expect(state.errorMessage, '昵称长度不能超过 64');
      expect(state.user, user);
    });
  });

  test('logout calls repository logout', () async {
    container.read(profileViewModelProvider);
    await Future<void>.delayed(Duration.zero);

    final notifier = container.read(profileViewModelProvider.notifier);
    await notifier.logout();

    expect(fakeAuthRepository.logoutCalled, isTrue);
  });
}
