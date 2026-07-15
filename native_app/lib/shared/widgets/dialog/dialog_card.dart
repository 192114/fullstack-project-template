import 'dart:ui';

import 'package:flutter/material.dart';

import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/shared/widgets/dialog/dialog_theme.dart';
import 'package:native_app/shared/widgets/dialog/dialog_type.dart';

/// 对话框卡片 UI 组件
///
/// 垂直居中布局（与 [MessageCard] 的水平布局不同）：
/// - 顶部：可选关闭按钮（右上角）
/// - 中间：状态图标（居中，48px）
/// - 下方：标题 + 描述（居中）
/// - 底部：操作按钮（水平排列）
///
/// 所有颜色来自 [AppDialogTheme]，不硬编码。
class DialogCard extends StatelessWidget {
  /// 对话框配置
  final DialogConfig config;

  /// 主题配置
  final AppDialogTheme theme;

  /// 按钮点击回调，参数为按钮索引
  final void Function(int index)? onAction;

  /// 关闭按钮回调
  final VoidCallback? onClose;

  const DialogCard({
    super.key,
    required this.config,
    required this.theme,
    this.onAction,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = theme.iconColor(config.type);
    final icon = theme.iconData(config.type);
    final bgColor = theme.backgroundColor;

    Widget card = Container(
      constraints: BoxConstraints(maxWidth: theme.maxWidth),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: theme.borderRadiusValue,
        border: Border.all(color: theme.borderColor),
        boxShadow: theme.boxShadow,
      ),
      child: Stack(
        children: [
          Padding(
            padding: theme.paddingValue,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // 顶部留白（给关闭按钮腾出空间）
                if (config.showClose) SizedBox(height: theme.closeIconSize),

                // 状态图标
                _StatusIcon(
                  icon: icon,
                  color: iconColor,
                  size: theme.iconSize,
                ),

                SizedBox(height: AppSpacing.lg),

                // 标题
                Text(
                  config.title,
                  style: AppTypography.titleMedium.copyWith(
                    color: theme.titleColor,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                // 描述（可选）
                if (config.message != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    config.message!,
                    style: AppTypography.bodyMedium.copyWith(
                      color: theme.descriptionColor,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                // 按钮区域
                if (config.actions.isNotEmpty) ...[
                  SizedBox(height: AppSpacing.xxl),
                  _ActionButtons(
                    actions: config.actions,
                    theme: theme,
                    onAction: onAction,
                  ),
                ],
              ],
            ),
          ),

          // 右上角关闭按钮
          if (config.showClose)
            Positioned(
              top: AppSpacing.sm,
              right: AppSpacing.sm,
              child: _CloseButton(
                onTap: onClose,
                iconSize: theme.closeIconSize,
                color: theme.descriptionColor,
              ),
            ),
        ],
      ),
    );

    // 毛玻璃效果
    if (config.enableBlur) {
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
      label: _buildSemanticLabel(config),
      child: card,
    );
  }

  /// 构建无障碍语义标签
  String _buildSemanticLabel(DialogConfig config) {
    final typeLabel = switch (config.type) {
      DialogType.info => '信息',
      DialogType.success => '成功',
      DialogType.warning => '警告',
      DialogType.error => '错误',
      DialogType.question => '确认',
      DialogType.danger => '危险操作',
    };

    final parts = <String>[typeLabel, config.title];
    if (config.message != null) {
      parts.add(config.message!);
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

/// 操作按钮区域
class _ActionButtons extends StatelessWidget {
  final List<DialogAction> actions;
  final AppDialogTheme theme;
  final void Function(int index)? onAction;

  const _ActionButtons({
    required this.actions,
    required this.theme,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    // 两个按钮：水平排列
    if (actions.length == 2) {
      return Row(
        children: [
          Expanded(
            child: _ActionButton(
              action: actions[0],
              theme: theme,
              onTap: () => onAction?.call(0),
            ),
          ),
          SizedBox(width: theme.buttonSpacing),
          Expanded(
            child: _ActionButton(
              action: actions[1],
              theme: theme,
              onTap: () => onAction?.call(1),
            ),
          ),
        ],
      );
    }

    // 其他数量：垂直排列
    return Column(
      children: List.generate(actions.length, (index) {
        return Column(
          children: [
            if (index > 0) SizedBox(height: theme.buttonSpacing),
            SizedBox(
              width: double.infinity,
              child: _ActionButton(
                action: actions[index],
                theme: theme,
                onTap: () => onAction?.call(index),
              ),
            ),
          ],
        );
      }),
    );
  }
}

/// 单个操作按钮
class _ActionButton extends StatelessWidget {
  final DialogAction action;
  final AppDialogTheme theme;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.action,
    required this.theme,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSecondary = action.style == DialogActionStyle.secondary;
    final bgColor = theme.buttonColor(action.style);
    final textColor = theme.buttonTextColorFor(action.style);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: theme.buttonHeight,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: theme.buttonRadiusValue,
          border: isSecondary
              ? Border.all(color: theme.buttonBorderColor)
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          action.text,
          style: AppTypography.labelLarge.copyWith(
            color: textColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
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
