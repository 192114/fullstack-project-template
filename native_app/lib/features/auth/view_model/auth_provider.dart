import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:native_app/core/network/dio_client.dart';
import 'package:native_app/core/network/token_manager.dart';

import '../datasources/auth_remote_datasource.dart';
import '../repositories/auth_repository.dart';
import '../repositories/auth_repository_impl.dart';
import 'login_view_model.dart';
import 'register_view_model.dart';
import 'reset_password_view_model.dart';

/// 认证远程数据源 Provider
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(dioClient);
});

/// 认证仓库 Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.read(authRemoteDataSourceProvider),
    tokenManager: tokenManager,
  );
});

/// 登录 ViewModel Provider
final loginViewModelProvider =
    NotifierProvider<LoginViewModel, LoginState>(LoginViewModel.new);

/// 注册 ViewModel Provider
final registerViewModelProvider =
    NotifierProvider<RegisterViewModel, RegisterState>(RegisterViewModel.new);

/// 重置密码 ViewModel Provider
final resetPasswordViewModelProvider =
    NotifierProvider<ResetPasswordViewModel, ResetPasswordState>(
        ResetPasswordViewModel.new);
