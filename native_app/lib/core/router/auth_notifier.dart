import 'package:flutter/foundation.dart';

/// 认证状态通知器
/// 用于驱动 GoRouter 的 refreshListenable，实现登录/登出后路由自动响应
class AuthNotifier extends ChangeNotifier {
  bool _isLoggedIn;

  AuthNotifier({this._isLoggedIn = false});

  /// 当前是否已登录
  bool get isLoggedIn => _isLoggedIn;

  /// 更新登录状态
  void setLoggedIn(bool value) {
    if (_isLoggedIn != value) {
      _isLoggedIn = value;
      notifyListeners();
    }
  }
}

/// 全局 AuthNotifier 单例
final authNotifier = AuthNotifier();
