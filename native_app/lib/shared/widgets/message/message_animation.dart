import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/message/message_type.dart';

/// 消息动画组件
///
/// 负责消息的入场和退场动画：
/// - 入场：从顶部轻微滑入 + 透明度 0→1，250ms，easeOutCubic
/// - 退场：向上移动 + 透明度 1→0，200ms
///
/// 根据 [MessagePosition] 自动调整动画方向：
/// - [MessagePosition.top]：从顶部滑入，向上滑出
/// - [MessagePosition.bottom]：从底部滑入，向下滑出
class MessageAnimation extends StatefulWidget {
  /// 子组件
  final Widget child;

  /// 显示位置
  final MessagePosition position;

  /// 入场动画时长
  final Duration enterDuration;

  /// 退场动画时长
  final Duration exitDuration;

  /// 入场动画曲线
  final Curve enterCurve;

  /// 退场动画曲线
  final Curve exitCurve;

  /// 滑入/滑出距离（像素）
  final double slideOffset;

  /// 动画完成回调（入场）
  final VoidCallback? onEntered;

  /// 动画完成回调（退场）
  final VoidCallback? onExited;

  /// 是否正在请求关闭
  ///
  /// 外部将其设为 true 时触发退场动画
  final bool isDismissed;

  const MessageAnimation({
    super.key,
    required this.child,
    required this.position,
    this.enterDuration = const Duration(milliseconds: 250),
    this.exitDuration = const Duration(milliseconds: 200),
    this.enterCurve = Curves.easeOutCubic,
    this.exitCurve = Curves.easeInToLinear,
    this.slideOffset = 30.0,
    this.onEntered,
    this.onExited,
    this.isDismissed = false,
  });

  @override
  State<MessageAnimation> createState() => _MessageAnimationState();
}

class _MessageAnimationState extends State<MessageAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  bool _hasExited = false;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: widget.enterDuration,
      reverseDuration: widget.exitDuration,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: widget.enterCurve,
      reverseCurve: widget.exitCurve,
    );

    // 根据位置决定滑动方向
    final slideBegin = widget.position == MessagePosition.top
        ? Offset(0, -widget.slideOffset)
        : Offset(0, widget.slideOffset);
    final slideEnd = Offset.zero;

    _slideAnimation = Tween<Offset>(
      begin: slideBegin,
      end: slideEnd,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.enterCurve,
      reverseCurve: widget.exitCurve,
    ));

    // 播放入场动画
    _controller.forward().then((_) {
      widget.onEntered?.call();
    });
  }

  @override
  void didUpdateWidget(MessageAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 外部请求关闭时触发退场动画
    if (widget.isDismissed && !_hasExited) {
      _hasExited = true;
      _controller.reverse().then((_) {
        widget.onExited?.call();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// 手动触发退场动画
  void dismiss() {
    if (!_hasExited) {
      _hasExited = true;
      _controller.reverse().then((_) {
        widget.onExited?.call();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            0,
            _slideAnimation.value.dy * 1,
          ),
          child: Opacity(
            opacity: _fadeAnimation.value,
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}
