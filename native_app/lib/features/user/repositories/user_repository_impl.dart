import '../datasources/user_remote_datasource.dart';
import '../models/user_model.dart';
import 'user_repository.dart';

/// 用户仓库实现
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remoteDataSource;

  UserRepositoryImpl({required this._remoteDataSource});

  @override
  Future<UserModel> updateProfile(UpdateProfileRequest request) async {
    final data = await _remoteDataSource.updateProfile(
      nickname: request.nickname,
      email: request.email,
      avatar: request.avatar,
    );
    return UserModel.fromJson(data);
  }

  @override
  Future<void> changePassword(ChangePasswordRequest request) async {
    await _remoteDataSource.changePassword(
      request.oldPassword,
      request.newPassword,
    );
  }
}
