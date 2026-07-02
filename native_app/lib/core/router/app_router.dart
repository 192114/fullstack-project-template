import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'auth_notifier.dart';

/// 路由路径常量
class RoutePaths {
  RoutePaths._();

  /// 登录页
  static const String login = '/login';

  /// 首页
  static const String home = '/home';

  /// 欢迎页 (免登录)
  static const String welcome = '/welcome';

  /// 404 页面
  static const String notFound = '/404';
}

/// 免登录访问的路由白名单
const _publicRoutes = {
  RoutePaths.login,
  RoutePaths.welcome,
};

/// 应用路由配置
class AppRouter {
  AppRouter._();

  static final _rootNavigatorKey = GlobalKey<NavigatorState>();

  /// 创建 GoRouter
  static GoRouter createRouter() {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
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
        // 首页
        GoRoute(
          path: RoutePaths.home,
          builder: (context, state) => const HomePage(),
        ),

        // 登录页
        GoRoute(
          path: RoutePaths.login,
          builder: (context, state) => const LoginPage(),
        ),

        // 欢迎页 (免登录)
        GoRoute(
          path: RoutePaths.welcome,
          builder: (context, state) => const WelcomePage(),
        ),

        // 示例: 需要特殊权限的页面 (路由级 redirect)
        // GoRoute(
        //   path: '/admin',
        //   redirect: (context, state) {
        //     if (!userRoleManager.isAdmin) return RoutePaths.home;
        //     return null;
        //   },
        //   builder: (context, state) => const AdminPage(),
        // ),
      ],
    );
  }
}

// ==================== 占位页面 ====================

/// 首页占位
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('首页')),
      body: const Center(child: Text('首页')),
    );
  }
}

/// 登录页占位
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('登录')),
      body: const Center(child: Text('登录页')),
    );
  }
}

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
