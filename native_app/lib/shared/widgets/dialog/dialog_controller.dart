import 'dart:async';

import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/dialog/dialog_overlay.dart';
import 'package:native_app/shared/widgets/dialog/dialog_theme.dart';
import 'package:native_app/shared/widgets/dialog/dialog_type.dart';
import 'package:native_app/shared/widgets/message/message.dart';

/// 对话框全局控制器
///
/// 单例模式，管理整个 App 的对话框展示生命周期。
/// 复用 [AppMessage.navigatorKey] 获取 OverlayState，无需传递 BuildContext。
///
/// 同时只允许一个对话框存在。新对话框弹出时，
/// 如果已有对话框在展示，会先关闭当前对话框。
///
/// 使用前由 [AppDialog] 自动初始化，无需手动调用。
class DialogController {
  DialogController._();

  /// 单例实例
  static final DialogController instance = DialogController._();

  /// 当前正在展示的 Overlay 管理器
  DialogOverlay<dynamic>? _currentOverlay;

  /// 主题配置
  AppDialogTheme theme = AppDialogTheme.defaultTheme;

  /// 获取当前 OverlayState
  OverlayState? get _overlayState {
    final navigator = AppMessage.navigatorKey.currentState;
    return navigator?.overlay;
  }

  /// 展示对话框
  ///
  /// 返回 [Future]，完成后包含用户选择的结果。
  /// - 点击按钮：返回按钮索引
  /// - 点击遮罩/关闭按钮：返回 null
  Future<T?> show<T>(DialogConfig config) {
    final overlay = _overlayState;
    if (overlay == null) {
      return Future.value(null);
    }

    // 如果已有对话框，先关闭
    _currentOverlay?.dispose();
    _currentOverlay = null;

    final completer = Completer<T?>();

    _currentOverlay = DialogOverlay<T>(
      theme: theme,
      config: config,
      onDismissed: (result) {
        _currentOverlay = null;
        if (!completer.isCompleted) {
          completer.complete(result);
        }
      },
    );

    _currentOverlay!.show(overlay);

    return completer.future;
  }

  /// 立即关闭当前对话框
  void dismiss() {
    _currentOverlay?.dismiss(null);
  }

  /// 清理资源
  void dispose() {
    _currentOverlay?.dispose();
    _currentOverlay = null;
  }
}
