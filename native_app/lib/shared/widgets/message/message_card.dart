import 'dart:ui';

import 'package:flutter/material.dart';

import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/shared/widgets/message/message_theme.dart';
import 'package:native_app/shared/widgets/message/message_type.dart';

/// 消息卡片 UI 组件
///
/// 渲染单条消息的视觉样式，包含：
/// - 左侧：状态图标（带类型配色）
/// - 中间：标题 + 描述
/// - 右侧：关闭按钮（可选）
///
/// 支持毛玻璃效果、点击关闭、向上滑动关闭。
/// 所有颜色来自 [MessageTheme]，不硬编码。
class MessageCard extends StatelessWidget {
  /// 消息数据
  final MessageData data;

  /// 主题配置
  final MessageTheme theme;

  /// 点击关闭回调
  final VoidCallback? onClose;

  const MessageCard({
    super.key,
    required this.data,
    required this.theme,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = theme.iconColor(data.type);
    final icon = theme.iconData(data.type);
    final bgColor = theme.backgroundColorFor(blur: data.enableBlur);

    Widget card = Container(
      constraints: BoxConstraints(
        minWidth: theme.minWidth,
        maxWidth: theme.maxWidth,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: theme.borderRadiusValue,
        border: Border.all(color: theme.borderColor),
        boxShadow: theme.boxShadow,
      ),
      child: Padding(
        padding: theme.paddingValue,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            // 左侧状态图标
            _StatusIcon(icon: icon, color: iconColor, size: theme.iconSize),
            const SizedBox(width: AppSpacing.md),

            // 中间标题 + 描述
            Expanded(
              child: _Content(
                title: data.title,
                description: data.description,
                theme: theme,
              ),
            ),

            // 右侧关闭按钮
            if (data.dismissible) ...[
              const SizedBox(width: AppSpacing.sm),
              _CloseButton(
                onTap: onClose,
                iconSize: theme.closeIconSize,
                color: theme.descriptionColor,
              ),
            ],
          ],
        ),
      ),
    );

    // 毛玻璃效果
    if (data.enableBlur) {
      card = ClipRRect(
        borderRadius: theme.borderRadiusValue,
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: theme.blurSigma,
            sigmaY: theme.blurSigma,
          ),
          child: card,
        ),
      );
    }

    // 无障碍语义
    return Semantics(
      label: _buildSemanticLabel(data),
      button: data.dismissible,
      enabled: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: data.dismissible ? onClose : null,
        onVerticalDragEnd: data.dismissible ? _handleDragEnd : null,
        child: card,
      ),
    );
  }

  /// 处理向上滑动关闭
  void _handleDragEnd(DragEndDetails details) {
    final velocity = details.primaryVelocity ?? 0;
    // 向上滑动速度超过阈值时关闭
    if (velocity < -300) {
      onClose?.call();
    }
  }

  /// 构建无障碍语义标签
  String _buildSemanticLabel(MessageData data) {
    final typeLabel = switch (data.type) {
      MessageType.success => '成功',
      MessageType.error => '错误',
      MessageType.warning => '警告',
      MessageType.info => '信息',
    };

    final parts = <String>[typeLabel, data.title];
    if (data.description != null) {
      parts.add(data.description!);
    }
    return parts.join('，');
  }
}

/// 状态图标
class _StatusIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;

  const _StatusIcon({
    required this.icon,
    required this.color,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Icon(icon, color: color, size: size);
  }
}

/// 标题和描述内容
class _Content extends StatelessWidget {
  final String title;
  final String? description;
  final MessageTheme theme;

  const _Content({
    required this.title,
    required this.description,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.titleSmall.copyWith(
            color: theme.titleColor,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        if (description != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            description!,
            style: AppTypography.bodySmall.copyWith(
              color: theme.descriptionColor,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ],
    );
  }
}

/// 关闭按钮
class _CloseButton extends StatelessWidget {
  final VoidCallback? onTap;
  final double iconSize;
  final Color color;

  const _CloseButton({
    required this.onTap,
    required this.iconSize,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xs),
        child: Icon(Icons.close_rounded, size: iconSize, color: color),
      ),
    );
  }
}
