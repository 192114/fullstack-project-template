import 'package:flutter/material.dart';

import 'config/theme/app_colors.dart';
import 'config/theme/app_typography.dart';
import 'core/router/app_router.dart';

/// 应用入口 Widget
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Native App',
      debugShowCheckedModeBanner: false,

      // 主题配置
      theme: ThemeData(
        colorScheme: AppColors.lightColorScheme,
        textTheme: AppTypography.textTheme,
        useMaterial3: true,
      ),

      // 路由配置
      routerConfig: AppRouter.createRouter(),
    );
  }
}
