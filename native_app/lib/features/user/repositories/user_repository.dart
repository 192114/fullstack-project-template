import 'package:native_app/features/user/models/user_model.dart';

/// 用户仓库抽象接口
abstract class UserRepository {
  /// 更新个人资料
  Future<UserModel> updateProfile(UpdateProfileRequest request);

  /// 修改密码
  Future<void> changePassword(ChangePasswordRequest request);
}
