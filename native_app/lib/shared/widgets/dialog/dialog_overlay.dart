import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/dialog/dialog_animation.dart';
import 'package:native_app/shared/widgets/dialog/dialog_card.dart';
import 'package:native_app/shared/widgets/dialog/dialog_theme.dart';
import 'package:native_app/shared/widgets/dialog/dialog_type.dart';

/// 对话框 Overlay 生命周期管理器
///
/// 负责对话框在 Overlay 中的完整生命周期：
/// 1. 创建背景遮罩 + 对话框卡片两个 [OverlayEntry]
/// 2. 播放缩放 + 淡入动画
/// 3. 处理按钮点击、关闭按钮、遮罩点击
/// 4. 播放缩放 + 淡出动画
/// 5. 移除 [OverlayEntry]
/// 6. 通过回调通知控制器完成
class DialogOverlay<T> {
  /// 背景遮罩 OverlayEntry
  OverlayEntry? _barrierEntry;

  /// 对话框卡片 OverlayEntry
  OverlayEntry? _dialogEntry;

  /// 是否已经关闭
  bool _isDismissed = false;

  /// 主题
  final AppDialogTheme theme;

  /// 对话框配置
  final DialogConfig config;

  /// 关闭后的回调（通知控制器）
  final void Function(T? result) onDismissed;

  /// 动画 key（用于手动触发 dismiss）
  final GlobalKey<_DialogOverlayWidgetState> _widgetKey =
      GlobalKey<_DialogOverlayWidgetState>();

  /// 结果值（由按钮点击设置）
  T? _result;

  DialogOverlay({
    required this.theme,
    required this.config,
    required this.onDismissed,
  });

  /// 展示对话框
  void show(OverlayState overlay) {
    _isDismissed = false;

    // 1. 背景遮罩
    _barrierEntry = OverlayEntry(
      builder: (context) => _BarrierWidget(
        color: theme.backdropColor,
        dismissible: config.barrierDismissible,
        onTap: () => dismiss(null),
      ),
    );
    overlay.insert(_barrierEntry!);

    // 2. 对话框卡片
    _dialogEntry = OverlayEntry(
      builder: (context) => _DialogOverlayWidget(
        key: _widgetKey,
        config: config,
        theme: theme,
        onAction: (index) {
          // 执行按钮回调
          config.actions[index].onTap?.call();
          dismiss(index as T?);
        },
        onClose: () => dismiss(null),
        onDismissed: _handleDismissed,
      ),
    );
    overlay.insert(_dialogEntry!);
  }

  /// 关闭对话框
  void dismiss(T? result) {
    if (_isDismissed) return;
    _isDismissed = true;
    _result = result;

    _widgetKey.currentState?.triggerDismiss();
  }

  /// 退场动画完成
  void _handleDismissed() {
    _barrierEntry?.remove();
    _dialogEntry?.remove();
    _barrierEntry = null;
    _dialogEntry = null;
    onDismissed(_result);
  }

  /// 清理资源
  void dispose() {
    _barrierEntry?.remove();
    _dialogEntry?.remove();
    _barrierEntry = null;
    _dialogEntry = null;
  }
}

/// 背景遮罩 Widget
class _BarrierWidget extends StatelessWidget {
  final Color color;
  final bool dismissible;
  final VoidCallback? onTap;

  const _BarrierWidget({
    required this.color,
    required this.dismissible,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: dismissible ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: ColoredBox(
        color: color,
        child: const SizedBox.expand(),
      ),
    );
  }
}

/// 对话框渲染 Widget
class _DialogOverlayWidget extends StatefulWidget {
  final DialogConfig config;
  final AppDialogTheme theme;
  final void Function(int index) onAction;
  final VoidCallback onClose;
  final VoidCallback onDismissed;

  const _DialogOverlayWidget({
    super.key,
    required this.config,
    required this.theme,
    required this.onAction,
    required this.onClose,
    required this.onDismissed,
  });

  @override
  State<_DialogOverlayWidget> createState() => _DialogOverlayWidgetState();
}

class _DialogOverlayWidgetState extends State<_DialogOverlayWidget> {
  bool _isDismissed = false;

  /// 触发退场动画
  void triggerDismiss() {
    if (mounted && !_isDismissed) {
      setState(() => _isDismissed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: DialogAnimation(
        isDismissed: _isDismissed,
        onExited: widget.onDismissed,
        child: DialogCard(
          config: widget.config,
          theme: widget.theme,
          onAction: widget.onAction,
          onClose: widget.onClose,
        ),
      ),
    );
  }
}
