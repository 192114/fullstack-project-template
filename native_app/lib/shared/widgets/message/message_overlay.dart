import 'dart:async';

import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/message/message_animation.dart';
import 'package:native_app/shared/widgets/message/message_card.dart';
import 'package:native_app/shared/widgets/message/message_theme.dart';
import 'package:native_app/shared/widgets/message/message_type.dart';

/// Overlay 消息展示管理器
///
/// 负责单条消息在 Overlay 中的完整生命周期：
/// 1. 创建 [OverlayEntry] 并插入到 [Overlay]
/// 2. 播放入场动画
/// 3. 启动自动关闭计时器
/// 4. 处理手动关闭（点击/滑动）
/// 5. 播放退场动画
/// 6. 移除 [OverlayEntry]
/// 7. 回调通知控制器展示下一条
class MessageOverlay {
  /// 当前的 OverlayEntry
  OverlayEntry? _overlayEntry;

  /// 自动关闭计时器
  Timer? _autoDismissTimer;

  /// 是否已经关闭（防止重复关闭）
  bool _isDismissed = false;

  /// 主题
  final MessageTheme theme;

  /// 消息关闭后的回调（通知控制器取下一条）
  final VoidCallback onDismissed;

  /// 动画 key（用于手动触发 dismiss）
  final GlobalKey<_MessageOverlayWidgetState> _widgetKey =
      GlobalKey<_MessageOverlayWidgetState>();

  MessageOverlay({
    required this.theme,
    required this.onDismissed,
  });

  /// 展示一条消息
  void show({
    required OverlayState overlay,
    required MessageData data,
  }) {
    _isDismissed = false;

    _overlayEntry = OverlayEntry(
      builder: (context) => _MessageOverlayWidget(
        key: _widgetKey,
        data: data,
        theme: theme,
        onDismissed: _handleDismissed,
      ),
    );

    overlay.insert(_overlayEntry!);

    // 启动自动关闭计时器
    _startAutoDismiss(data.duration);
  }

  /// 启动自动关闭计时器
  void _startAutoDismiss(Duration duration) {
    _autoDismissTimer?.cancel();
    _autoDismissTimer = Timer(duration, dismiss);
  }

  /// 手动关闭（立即触发退场动画）
  void dismiss() {
    if (_isDismissed) return;
    _isDismissed = true;

    // 取消自动关闭计时器
    _autoDismissTimer?.cancel();
    _autoDismissTimer = null;

    // 触发退场动画
    _widgetKey.currentState?.triggerDismiss();
  }

  /// 退场动画完成后的回调
  void _handleDismissed() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    onDismissed();
  }

  /// 清理资源
  void dispose() {
    _autoDismissTimer?.cancel();
    _overlayEntry?.remove();
    _overlayEntry = null;
  }
}

/// Overlay 内部渲染的 Widget
///
/// 将 [MessageAnimation] 和 [MessageCard] 组合在一起，
/// 并处理安全区域定位。
class _MessageOverlayWidget extends StatefulWidget {
  final MessageData data;
  final MessageTheme theme;
  final VoidCallback onDismissed;

  const _MessageOverlayWidget({
    super.key,
    required this.data,
    required this.theme,
    required this.onDismissed,
  });

  @override
  State<_MessageOverlayWidget> createState() => _MessageOverlayWidgetState();
}

class _MessageOverlayWidgetState extends State<_MessageOverlayWidget> {
  bool _isDismissed = false;

  /// 触发退场动画
  void triggerDismiss() {
    if (mounted && !_isDismissed) {
      setState(() => _isDismissed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final theme = widget.theme;
    final data = widget.data;

    // 计算安全区域偏移
    final safeAreaTop = mediaQuery.padding.top;
    final safeAreaBottom = mediaQuery.padding.bottom;
    final safePadding = theme.safeAreaPadding;

    // 定位
    Alignment alignment;
    EdgeInsets padding;

    switch (data.position) {
      case MessagePosition.top:
        alignment = Alignment.topCenter;
        padding = EdgeInsets.only(
          top: safeAreaTop + safePadding,
          left: safePadding,
          right: safePadding,
        );
        break;
      case MessagePosition.bottom:
        alignment = Alignment.bottomCenter;
        padding = EdgeInsets.only(
          bottom: safeAreaBottom + safePadding,
          left: safePadding,
          right: safePadding,
        );
        break;
    }

    return Material(
      type: MaterialType.transparency,
      child: Align(
        alignment: alignment,
        child: Padding(
          padding: padding,
          child: MessageAnimation(
            position: data.position,
            isDismissed: _isDismissed,
            onExited: widget.onDismissed,
            child: MessageCard(
              data: data,
              theme: theme,
              onClose: triggerDismiss,
            ),
          ),
        ),
      ),
    );
  }
}
