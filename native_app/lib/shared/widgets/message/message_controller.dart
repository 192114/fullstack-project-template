import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/message/message_overlay.dart';
import 'package:native_app/shared/widgets/message/message_queue.dart';
import 'package:native_app/shared/widgets/message/message_theme.dart';
import 'package:native_app/shared/widgets/message/message_type.dart';

/// 消息全局控制器
///
/// 单例模式，管理整个 App 的消息展示生命周期。
/// 通过 [navigatorKey] 获取 OverlayState，无需传递 BuildContext。
///
/// 内部使用 [MessageQueue] 进行队列管理，使用 [MessageOverlay] 进行渲染。
///
/// 使用前需调用 [initialize] 传入 [navigatorKey]：
/// ```dart
/// MessageController.instance.initialize(navigatorKey);
/// ```
class MessageController {
  MessageController._();

  /// 单例实例
  static final MessageController instance = MessageController._();

  /// Navigator key（用于获取 OverlayState）
  GlobalKey<NavigatorState>? _navigatorKey;

  /// 消息队列
  final MessageQueue _queue = MessageQueue(maxQueueSize: 5);

  /// 当前正在展示的 Overlay 管理器
  MessageOverlay? _currentOverlay;

  /// 主题配置
  MessageTheme theme = MessageTheme.defaultTheme;

  /// 是否已初始化
  bool _initialized = false;

  /// 初始化控制器
  ///
  /// 传入 MaterialApp 的 [navigatorKey]，用于获取全局 Overlay。
  void initialize(GlobalKey<NavigatorState> navigatorKey) {
    _navigatorKey = navigatorKey;
    _initialized = true;

    // 设置队列回调：当队列中当前消息变化时，展示新消息
    _queue.onMessageChanged = _onMessageChanged;
  }

  /// 检查是否已初始化
  void _ensureInitialized() {
    if (!_initialized || _navigatorKey == null) {
      throw StateError(
        'MessageController 未初始化。请在 MaterialApp 中设置 navigatorKey '
        '并调用 AppMessage.initialize(navigatorKey)。',
      );
    }
  }

  /// 获取当前 OverlayState
  OverlayState? get _overlayState {
    final navigator = _navigatorKey?.currentState;
    return navigator?.overlay;
  }

  /// 展示一条消息
  ///
  /// [mode] 控制入队行为：
  /// - [MessageQueueMode.queue]：加入队列等待（默认）
  /// - [MessageQueueMode.replaceCurrent]：立即替换当前消息
  void show(MessageData data, {MessageQueueMode mode = MessageQueueMode.queue}) {
    _ensureInitialized();

    final overlay = _overlayState;
    if (overlay == null) {
      // Overlay 不可用时静默忽略
      return;
    }

    _queue.enqueue(data, mode: mode);
  }

  /// 队列消息变化回调
  void _onMessageChanged(MessageData? current) {
    if (current != null) {
      // 有新消息需要展示
      _currentOverlay?.dispose();
      _currentOverlay = MessageOverlay(
        theme: theme,
        onDismissed: _onOverlayDismissed,
      );
      _currentOverlay!.show(
        overlay: _overlayState!,
        data: current,
      );
    }
  }

  /// 当前消息退场完成
  void _onOverlayDismissed() {
    _currentOverlay = null;
    // 取出队列中的下一条
    _queue.next();
  }

  /// 立即关闭当前消息
  void dismissCurrent() {
    _currentOverlay?.dismiss();
  }

  /// 清空所有消息（当前 + 队列）
  void clearAll() {
    _currentOverlay?.dispose();
    _currentOverlay = null;
    _queue.clear();
  }

  /// 仅清空等待队列（不影响当前消息）
  void clearPending() {
    _queue.clearPending();
  }
}
