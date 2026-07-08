import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/features/auth/view/login_page.dart';
import 'package:native_app/features/auth/view/register_page.dart';
import 'package:native_app/features/auth/view/reset_password_page.dart';
import 'package:native_app/features/user/view/change_password_page.dart';
import 'package:native_app/features/user/view/profile_page.dart';
import 'package:native_app/shared/widgets/message/message.dart';

import 'auth_notifier.dart';

/// 路由路径常量
class RoutePaths {
  RoutePaths._();

  /// 登录页
  static const String login = '/login';

  /// 首页（个人资料页）
  static const String home = '/home';

  /// 欢迎页 (免登录)
  static const String welcome = '/welcome';

  /// 注册页 (免登录)
  static const String register = '/register';

  /// 重置密码页 (免登录)
  static const String resetPassword = '/reset-password';

  /// 个人资料页
  static const String profile = '/profile';

  /// 修改密码页
  static const String changePassword = '/profile/change-password';

  /// 404 页面
  static const String notFound = '/404';
}

/// 免登录访问的路由白名单
const _publicRoutes = {
  RoutePaths.login,
  RoutePaths.welcome,
  RoutePaths.register,
  RoutePaths.resetPassword,
};

/// 应用路由配置
class AppRouter {
  AppRouter._();

  /// 创建 GoRouter
  ///
  /// 使用 [AppMessage.navigatorKey] 作为根 Navigator Key，
  /// 这样全局消息提示组件可以访问 Overlay。
  static GoRouter createRouter() {
    return GoRouter(
      navigatorKey: AppMessage.navigatorKey,
      initialLocation: RoutePaths.home,
      debugLogDiagnostics: true,

      // 全局 redirect - 通用登录态校验
      redirect: (context, state) {
        final isLoggedIn = authNotifier.isLoggedIn;
        final currentPath = state.matchedLocation;

        // 白名单路由免登录
        if (_publicRoutes.contains(currentPath)) {
          // 已登录时访问登录页，跳转到首页
          if (isLoggedIn && currentPath == RoutePaths.login) {
            return RoutePaths.home;
          }
          return null;
        }

        // 未登录时访问需要认证的页面，跳转到登录页
        if (!isLoggedIn) {
          return RoutePaths.login;
        }

        return null;
      },

      // refreshListenable - 响应式导航
      refreshListenable: authNotifier,

      // 错误页面
      errorBuilder: (context, state) => const NotFoundPage(),

      // 路由定义
      routes: [
        // 首页（个人资料页）
        GoRoute(
          path: RoutePaths.home,
          builder: (context, state) => const ProfilePage(),
        ),

        // 个人资料页（别名，重定向到首页）
        GoRoute(
          path: RoutePaths.profile,
          redirect: (context, state) => RoutePaths.home,
        ),

        // 登录页
        GoRoute(
          path: RoutePaths.login,
          builder: (context, state) => const LoginPage(),
        ),

        // 注册页
        GoRoute(
          path: RoutePaths.register,
          builder: (context, state) => const RegisterPage(),
        ),

        // 重置密码页
        GoRoute(
          path: RoutePaths.resetPassword,
          builder: (context, state) => const ResetPasswordPage(),
        ),

        // 修改密码页
        GoRoute(
          path: RoutePaths.changePassword,
          builder: (context, state) => const ChangePasswordPage(),
        ),

        // 欢迎页 (免登录)
        GoRoute(
          path: RoutePaths.welcome,
          builder: (context, state) => const WelcomePage(),
        ),
      ],
    );
  }
}

// ==================== 占位页面 ====================

/// 欢迎页占位
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: const Center(child: Text('欢迎页')),
    );
  }
}

/// 404 页面
class NotFoundPage extends StatelessWidget {
  const NotFoundPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('页面未找到')),
      body: const Center(child: Text('404 - 页面未找到')),
    );
  }
}
