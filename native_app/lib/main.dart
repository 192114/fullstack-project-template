import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'config/env/app_env.dart';
import 'core/network/dio_client.dart';
import 'core/network/token_manager.dart';
import 'core/router/auth_notifier.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. 加载环境配置
  await dotenv.load(fileName: 'lib/config/env/.env.dev');
  envConfig = EnvConfig.fromDotEnv();

  // 2. 初始化 TokenManager
  await tokenManager.init();

  // 3. 设置 TokenManager 认证状态回调
  tokenManager.onAuthStateChanged = () {
    authNotifier.setLoggedIn(tokenManager.hasToken);
  };

  // 4. 初始化 AuthNotifier 状态
  authNotifier.setLoggedIn(tokenManager.hasToken);

  // 5. 初始化 DioClient
  dioClient = DioClient(envConfig: envConfig, tokenManager: tokenManager);

  runApp(const ProviderScope(child: App()));
}
