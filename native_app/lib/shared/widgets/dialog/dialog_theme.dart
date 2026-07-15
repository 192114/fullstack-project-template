import 'package:flutter/material.dart';

import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/shared/widgets/dialog/dialog_type.dart';

/// 对话框主题配置
///
/// 状态图标色、标题色、描述色、边框色、背景色全部复用
/// [AppColors.messageXxx] 系列，与 [MessageTheme] 保持一致。
/// 新增对话框专属的按钮主色、蓝色调阴影、背景遮罩。
///
/// 用法：
/// ```dart
/// final theme = DialogTheme.of(context);
/// final color = theme.iconColor(DialogType.success);
/// ```
@immutable
class AppDialogTheme {
  const AppDialogTheme({
    // 类型配色 — 复用 message 系列
    this.successColor = AppColors.messageSuccess,
    this.errorColor = AppColors.messageError,
    this.warningColor = AppColors.messageWarning,
    this.infoColor = AppColors.messageInfo,

    // 通用配色 — 复用 message 系列
    this.borderColor = AppColors.messageBorder,
    this.titleColor = AppColors.messageTitle,
    this.descriptionColor = AppColors.messageDescription,
    this.backgroundColor = AppColors.messageBackground,
    this.blurBackgroundColor = AppColors.messageBlurBackground,

    // 对话框专属配色
    this.primaryColor = AppColors.dialogPrimary,
    this.dangerColor = AppColors.dialogDanger,
    this.shadowColor = AppColors.dialogShadow,
    this.backdropColor = AppColors.dialogBackdrop,
    this.buttonBorderColor = AppColors.dialogButtonBorder,
    this.buttonTextColor = AppColors.dialogButtonText,

    // 卡片尺寸
    this.borderRadius = 16.0,
    this.padding = 24.0,
    this.maxWidth = 340.0,

    // 图标
    this.iconSize = 48.0,
    this.closeIconSize = 20.0,

    // 按钮尺寸
    this.buttonRadius = 12.0,
    this.buttonHeight = 44.0,
    this.buttonSpacing = 12.0,

    // 阴影
    this.shadowBlur = 30.0,
    this.shadowOffset = const Offset(0, 10),

    // 毛玻璃
    this.blurSigma = 20.0,
  });

  // ==================== 类型配色 ====================
  final Color successColor;
  final Color errorColor;
  final Color warningColor;
  final Color infoColor;

  // ==================== 通用配色 ====================
  final Color borderColor;
  final Color titleColor;
  final Color descriptionColor;
  final Color backgroundColor;
  final Color blurBackgroundColor;

  // ==================== 对话框专属配色 ====================
  /// 按钮主色
  final Color primaryColor;

  /// 危险按钮色
  final Color dangerColor;

  /// 蓝色调阴影色
  final Color shadowColor;

  /// 背景遮罩色
  final Color backdropColor;

  /// 次要按钮边框色
  final Color buttonBorderColor;

  /// 次要按钮文字色
  final Color buttonTextColor;

  // ==================== 卡片尺寸 ====================
  final double borderRadius;
  final double padding;
  final double maxWidth;

  // ==================== 图标 ====================
  final double iconSize;
  final double closeIconSize;

  // ==================== 按钮尺寸 ====================
  final double buttonRadius;
  final double buttonHeight;
  final double buttonSpacing;

  // ==================== 阴影 ====================
  final double shadowBlur;
  final Offset shadowOffset;

  // ==================== 毛玻璃 ====================
  final double blurSigma;

  // ==================== 便捷方法 ====================

  /// 根据类型获取图标颜色
  Color iconColor(DialogType type) {
    switch (type) {
      case DialogType.success:
        return successColor;
      case DialogType.error:
        return errorColor;
      case DialogType.warning:
        return warningColor;
      case DialogType.info:
      case DialogType.question:
        return infoColor;
      case DialogType.danger:
        return errorColor;
    }
  }

  /// 根据类型获取图标数据
  IconData iconData(DialogType type) {
    switch (type) {
      case DialogType.success:
        return Icons.check_circle_rounded;
      case DialogType.error:
        return Icons.error_rounded;
      case DialogType.warning:
        return Icons.warning_rounded;
      case DialogType.info:
        return Icons.info_rounded;
      case DialogType.question:
      case DialogType.danger:
        return Icons.help_outline_rounded;
    }
  }

  /// 根据按钮样式获取背景色
  Color buttonColor(DialogActionStyle style) {
    switch (style) {
      case DialogActionStyle.primary:
        return primaryColor;
      case DialogActionStyle.danger:
        return dangerColor;
      case DialogActionStyle.secondary:
        return backgroundColor;
    }
  }

  /// 根据按钮样式获取文字色
  Color buttonTextColorFor(DialogActionStyle style) {
    switch (style) {
      case DialogActionStyle.primary:
      case DialogActionStyle.danger:
        return Colors.white;
      case DialogActionStyle.secondary:
        return buttonTextColor;
    }
  }

  /// 获取阴影列表
  List<BoxShadow> get boxShadow => [
        BoxShadow(
          color: shadowColor,
          blurRadius: shadowBlur,
          offset: shadowOffset,
        ),
      ];

  /// 获取圆角
  BorderRadius get borderRadiusValue => BorderRadius.circular(borderRadius);

  /// 获取内边距
  EdgeInsets get paddingValue => EdgeInsets.all(padding);

  /// 获取按钮圆角
  BorderRadius get buttonRadiusValue => BorderRadius.circular(buttonRadius);

  // ==================== 主题实例 ====================

  static const AppDialogTheme defaultTheme = AppDialogTheme();

  static AppDialogTheme of(BuildContext context) {
    return defaultTheme;
  }
}
