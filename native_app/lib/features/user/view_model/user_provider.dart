import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:native_app/core/network/dio_client.dart';

import '../datasources/user_remote_datasource.dart';
import '../repositories/user_repository.dart';
import '../repositories/user_repository_impl.dart';
import 'change_password_view_model.dart';
import 'profile_view_model.dart';

/// 用户远程数据源 Provider
final userRemoteDataSourceProvider = Provider<UserRemoteDataSource>((ref) {
  return UserRemoteDataSource(dioClient);
});

/// 用户仓库 Provider
final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepositoryImpl(
    remoteDataSource: ref.read(userRemoteDataSourceProvider),
  );
});

/// 个人资料 ViewModel Provider
final profileViewModelProvider =
    NotifierProvider<ProfileViewModel, ProfileState>(ProfileViewModel.new);

/// 修改密码 ViewModel Provider
final changePasswordViewModelProvider =
    NotifierProvider<ChangePasswordViewModel, ChangePasswordState>(
        ChangePasswordViewModel.new);
