import 'package:native_app/features/user/models/user_model.dart';
import 'package:native_app/features/user/repositories/user_repository.dart';

/// [UserRepository] 的手写 Fake 实现，供 ViewModel 状态测试使用。
class FakeUserRepository implements UserRepository {
  UserModel? updateProfileResponse;
  Object? errorToThrow;

  @override
  Future<UserModel> updateProfile(UpdateProfileRequest request) async {
    if (errorToThrow != null) throw errorToThrow!;
    return updateProfileResponse!;
  }

  @override
  Future<void> changePassword(ChangePasswordRequest request) async {
    if (errorToThrow != null) throw errorToThrow!;
  }
}
