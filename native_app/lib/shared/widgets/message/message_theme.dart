import 'package:flutter/material.dart';

import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/shared/widgets/message/message_type.dart';

/// 消息主题配置
///
/// 所有颜色和样式均来自 [AppColors]，不硬编码。
/// 方便未来支持 Light Theme / Dark Theme / 动态主题切换。
///
/// 用法：
/// ```dart
/// final theme = MessageTheme.of(context);
/// final color = theme.iconColor(MessageType.success);
/// ```
@immutable
class MessageTheme {
  const MessageTheme({
    this.successColor = AppColors.messageSuccess,
    this.errorColor = AppColors.messageError,
    this.warningColor = AppColors.messageWarning,
    this.infoColor = AppColors.messageInfo,
    this.borderColor = AppColors.messageBorder,
    this.titleColor = AppColors.messageTitle,
    this.descriptionColor = AppColors.messageDescription,
    this.backgroundColor = AppColors.messageBackground,
    this.blurBackgroundColor = AppColors.messageBlurBackground,
    this.shadowColor = AppColors.messageShadow,
    this.borderRadius = 20.0,
    this.padding = AppSpacing.lg,
    this.iconSize = 24.0,
    this.closeIconSize = 18.0,
    this.blurSigma = 15.0,
    this.shadowBlur = 20.0,
    this.shadowOffset = const Offset(0, 8),
    this.minWidth = 340.0,
    this.maxWidth = 420.0,
    this.safeAreaPadding = AppSpacing.lg,
  });

  // ==================== 类型配色 ====================
  /// 成功色
  final Color successColor;

  /// 错误色
  final Color errorColor;

  /// 警告色
  final Color warningColor;

  /// 信息色
  final Color infoColor;

  // ==================== 通用配色 ====================
  /// 边框色
  final Color borderColor;

  /// 标题色
  final Color titleColor;

  /// 描述色
  final Color descriptionColor;

  /// 背景色
  final Color backgroundColor;

  /// 毛玻璃背景色
  final Color blurBackgroundColor;

  /// 阴影色
  final Color shadowColor;

  // ==================== 尺寸 ====================
  /// 圆角
  final double borderRadius;

  /// 内边距
  final double padding;

  /// 状态图标大小
  final double iconSize;

  /// 关闭按钮图标大小
  final double closeIconSize;

  /// 毛玻璃模糊系数
  final double blurSigma;

  /// 阴影模糊半径
  final double shadowBlur;

  /// 阴影偏移
  final Offset shadowOffset;

  /// 最小宽度
  final double minWidth;

  /// 最大宽度
  final double maxWidth;

  /// 安全区域间距
  final double safeAreaPadding;

  // ==================== 便捷方法 ====================

  /// 根据消息类型获取图标颜色
  Color iconColor(MessageType type) {
    switch (type) {
      case MessageType.success:
        return successColor;
      case MessageType.error:
        return errorColor;
      case MessageType.warning:
        return warningColor;
      case MessageType.info:
        return infoColor;
    }
  }

  /// 根据消息类型获取图标数据
  IconData iconData(MessageType type) {
    switch (type) {
      case MessageType.success:
        return Icons.check_circle_rounded;
      case MessageType.error:
        return Icons.error_rounded;
      case MessageType.warning:
        return Icons.warning_rounded;
      case MessageType.info:
        return Icons.info_rounded;
    }
  }

  /// 获取背景色（根据是否启用毛玻璃）
  Color backgroundColorFor({bool blur = false}) {
    return blur ? blurBackgroundColor : backgroundColor;
  }

  /// 获取阴影
  List<BoxShadow> get boxShadow => [
        BoxShadow(
          color: shadowColor,
          blurRadius: shadowBlur,
          offset: shadowOffset,
        ),
      ];

  /// 获取圆角
  BorderRadius get borderRadiusValue =>
      BorderRadius.circular(borderRadius);

  /// 获取内边距
  EdgeInsets get paddingValue => EdgeInsets.all(padding);

  // ==================== 主题实例 ====================

  /// 默认主题
  static const MessageTheme defaultTheme = MessageTheme();

  /// 从 [BuildContext] 获取主题（预留 Dark Theme 扩展点）
  ///
  /// 当前返回默认主题。未来可通过 InheritedWidget 或 ThemeExtension
  /// 实现明暗主题切换。
  static MessageTheme of(BuildContext context) {
    // 预留：未来支持 ThemeExtension<MessageTheme>
    // final extension = Theme.of(context).extension<MessageThemeExtension>();
    // return extension?.theme ?? defaultTheme;
    return defaultTheme;
  }
}
