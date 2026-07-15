import 'package:flutter/material.dart';

/// 对话框动画组件
///
/// 负责对话框的入场和退场动画：
/// - 入场：缩放 0.95→1.0 + 透明度 0→1，200ms，easeOutCubic
/// - 退场：缩放 1.0→0.95 + 透明度 1→0，150ms，easeInToLinear
///
/// 同时管理背景遮罩的淡入淡出动画。
class DialogAnimation extends StatefulWidget {
  /// 卡片子组件
  final Widget child;

  /// 背景遮罩组件
  final Widget? barrier;

  /// 入场动画时长
  final Duration enterDuration;

  /// 退场动画时长
  final Duration exitDuration;

  /// 入场动画曲线
  final Curve enterCurve;

  /// 退场动画曲线
  final Curve exitCurve;

  /// 缩放起始值
  final double scaleBegin;

  /// 动画完成回调（入场）
  final VoidCallback? onEntered;

  /// 动画完成回调（退场）
  final VoidCallback? onExited;

  /// 是否正在请求关闭
  final bool isDismissed;

  const DialogAnimation({
    super.key,
    required this.child,
    this.barrier,
    this.enterDuration = const Duration(milliseconds: 200),
    this.exitDuration = const Duration(milliseconds: 150),
    this.enterCurve = Curves.easeOutCubic,
    this.exitCurve = Curves.easeInToLinear,
    this.scaleBegin = 0.95,
    this.onEntered,
    this.onExited,
    this.isDismissed = false,
  });

  @override
  State<DialogAnimation> createState() => _DialogAnimationState();
}

class _DialogAnimationState extends State<DialogAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

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

    _scaleAnimation = Tween<double>(
      begin: widget.scaleBegin,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.enterCurve,
      reverseCurve: widget.exitCurve,
    ));

    _controller.forward().then((_) {
      widget.onEntered?.call();
    });
  }

  @override
  void didUpdateWidget(DialogAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);

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
        return Stack(
          children: [
            // 背景遮罩
            if (widget.barrier != null)
              Opacity(
                opacity: _fadeAnimation.value,
                child: widget.barrier,
              ),
            // 对话框卡片
            Center(
              child: Opacity(
                opacity: _fadeAnimation.value,
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: child,
                ),
              ),
            ),
          ],
        );
      },
      child: widget.child,
    );
  }
}
