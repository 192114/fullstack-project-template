import 'package:flutter/material.dart';

/// 应用颜色常量
/// 基于科研工作台设计稿的蓝色主题
/// 手动定义完整 ColorScheme，精确控制每个颜色值
class AppColors {
  AppColors._();

  // ==================== 品牌色 ====================
  /// 主色 - 科研蓝
  static const Color primary = Color(0xFF1565C0);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFD1E4FF);
  static const Color onPrimaryContainer = Color(0xFF001D36);

  // ==================== 辅助色 ====================
  static const Color secondary = Color(0xFF535F70);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFD7E3F7);
  static const Color onSecondaryContainer = Color(0xFF101C2B);

  // ==================== 第三色 ====================
  static const Color tertiary = Color(0xFF6B5778);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFF2DAFF);
  static const Color onTertiaryContainer = Color(0xFF251431);

  // ==================== 错误色 ====================
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF410002);

  // ==================== 表面色 ====================
  static const Color surface = Color(0xFFFDFBFF);
  static const Color onSurface = Color(0xFF1A1C1E);
  static const Color surfaceVariant = Color(0xFFDFE2EB);
  static const Color onSurfaceVariant = Color(0xFF43474E);
  static const Color surfaceTint = Color(0xFF1565C0);

  // ==================== 背景色 ====================
  static const Color background = Color(0xFFEDF5FF);
  static const Color onBackground = Color(0xFF1A1C1E);

  // ==================== 轮廓色 ====================
  static const Color outline = Color(0xFF73777F);
  static const Color outlineVariant = Color(0xFFC3C6CF);

  // ==================== 其他 ====================
  static const Color shadow = Color(0xFF000000);
  static const Color scrim = Color(0xFF000000);
  static const Color inverseSurface = Color(0xFF2F3033);
  static const Color onInverseSurface = Color(0xFFF1F0F4);
  static const Color inversePrimary = Color(0xFFA0C7FF);

  // ==================== 设计稿专用色 ====================
  /// 深蓝文字色 - 用于标题和标语
  static const Color darkText = Color(0xFF0A1628);
  /// 次要文字色 - 用于副标题和提示
  static const Color secondaryText = Color(0xFF6B7B8D);
  /// 输入框边框色
  static const Color inputBorder = Color(0xFFE0E6ED);
  /// 输入框提示文字色
  static const Color hintText = Color(0xFFB0BEC5);
  /// 登录卡片背景色
  static const Color cardBackground = Color(0xFFFFFFFF);
  /// 分割线颜色
  static const Color dividerColor = Color(0xFFE0E6ED);

  // ==================== 快捷访问 ====================
  /// 成功色
  static const Color success = Color(0xFF4CAF50);
  /// 警告色
  static const Color warning = Color(0xFFFFC107);
  /// 信息色
  static const Color info = Color(0xFF2196F3);

  // ==================== 消息组件配色 ====================
  /// 消息 - 成功图标色
  static const Color messageSuccess = Color(0xFF16A34A);
  /// 消息 - 错误图标色
  static const Color messageError = Color(0xFFDC2626);
  /// 消息 - 警告图标色
  static const Color messageWarning = Color(0xFFD97706);
  /// 消息 - 信息图标色
  static const Color messageInfo = Color(0xFF2563EB);
  /// 消息 - 边框色
  static const Color messageBorder = Color(0xFFE5E7EB);
  /// 消息 - 标题色
  static const Color messageTitle = Color(0xFF111827);
  /// 消息 - 描述色
  static const Color messageDescription = Color(0xFF6B7280);
  /// 消息 - 背景色
  static const Color messageBackground = Color(0xFFFFFFFF);
  /// 消息 - 毛玻璃背景色 (70% 白色透明)
  static const Color messageBlurBackground = Color(0xB3FFFFFF);
  /// 消息 - 阴影色
  static const Color messageShadow = Color(0x14000000);

  // ==================== 对话框配色 ====================
  /// 对话框 - 按钮主色
  static const Color dialogPrimary = Color(0xFF1F60FF);
  /// 对话框 - 危险按钮色
  static const Color dialogDanger = Color(0xFFDC2626);
  /// 对话框 - 蓝色调阴影
  static const Color dialogShadow = Color(0x1A1F60FF);
  /// 对话框 - 背景遮罩 (40% 黑色透明)
  static const Color dialogBackdrop = Color(0x66000000);
  /// 对话框 - 次要按钮边框色
  static const Color dialogButtonBorder = Color(0xFFE5E7EB);
  /// 对话框 - 次要按钮文字色
  static const Color dialogButtonText = Color(0xFF111827);

  // ==================== ColorScheme ====================
  /// 亮色模式 ColorScheme
  static ColorScheme get lightColorScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: primary,
        onPrimary: onPrimary,
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        secondary: secondary,
        onSecondary: onSecondary,
        secondaryContainer: secondaryContainer,
        onSecondaryContainer: onSecondaryContainer,
        tertiary: tertiary,
        onTertiary: onTertiary,
        tertiaryContainer: tertiaryContainer,
        onTertiaryContainer: onTertiaryContainer,
        error: error,
        onError: onError,
        errorContainer: errorContainer,
        onErrorContainer: onErrorContainer,
        surface: surface,
        onSurface: onSurface,
        surfaceTint: surfaceTint,
        surfaceContainerHighest: surfaceVariant,
        onSurfaceVariant: onSurfaceVariant,
        outline: outline,
        outlineVariant: outlineVariant,
        shadow: shadow,
        scrim: scrim,
        inverseSurface: inverseSurface,
        onInverseSurface: onInverseSurface,
        inversePrimary: inversePrimary,
      );

  /// 暗色模式 ColorScheme (预留)
  static ColorScheme get darkColorScheme => const ColorScheme(
        brightness: Brightness.dark,
        primary: Color(0xFFA0C7FF),
        onPrimary: Color(0xFF003258),
        primaryContainer: Color(0xFF00497D),
        onPrimaryContainer: Color(0xFFD1E4FF),
        secondary: Color(0xFFBBC7DB),
        onSecondary: Color(0xFF253140),
        secondaryContainer: Color(0xFF3C4858),
        onSecondaryContainer: Color(0xFFD7E3F7),
        tertiary: Color(0xFFD7BDE4),
        onTertiary: Color(0xFF3B2948),
        tertiaryContainer: Color(0xFF523F5F),
        onTertiaryContainer: Color(0xFFF2DAFF),
        error: Color(0xFFFFB4AB),
        onError: Color(0xFF690005),
        errorContainer: Color(0xFF93000A),
        onErrorContainer: Color(0xFFFFDAD6),
        surface: Color(0xFF1A1C1E),
        onSurface: Color(0xFFE3E2E6),
        surfaceTint: Color(0xFFA0C7FF),
        surfaceContainerHighest: Color(0xFF43474E),
        onSurfaceVariant: Color(0xFFC3C6CF),
        outline: Color(0xFF8D9199),
        outlineVariant: Color(0xFF43474E),
        shadow: Color(0xFF000000),
        scrim: Color(0xFF000000),
        inverseSurface: Color(0xFFE3E2E6),
        onInverseSurface: Color(0xFF2F3033),
        inversePrimary: Color(0xFF1565C0),
      );
}
