import 'package:flutter/material.dart';

/// 应用圆角常量
/// 统一组件圆角大小
class AppRadius {
  AppRadius._();

  // ==================== 基础圆角 ====================
  /// 4px - 超小圆角
  static const double xs = 4;

  /// 8px - 小圆角
  static const double sm = 8;

  /// 12px - 中圆角
  static const double md = 12;

  /// 16px - 大圆角
  static const double lg = 16;

  /// 24px - 超大圆角
  static const double xl = 24;

  /// 28px - Material 3 默认大组件圆角
  static const double xxl = 28;

  /// 999px - 完全圆形 (胶囊形)
  static const double full = 999;

  // ==================== 组件专用圆角 ====================
  /// 按钮圆角
  static const double button = 20;

  /// 卡片圆角
  static const double card = 12;

  /// 输入框圆角
  static const double inputField = 12;

  /// 对话框圆角
  static const double dialog = 28;

  /// 底部弹窗圆角
  static const double bottomSheet = 28;

  /// 芯片圆角
  static const double chip = 8;

  /// 头像圆角 (圆形)
  static const double avatar = 999;

  // ==================== BorderRadius 快捷方法 ====================
  /// 统一圆角
  static BorderRadius circular(double radius) =>
      BorderRadius.circular(radius);

  /// 仅顶部圆角
  static BorderRadius top(double radius) => BorderRadius.vertical(
        top: Radius.circular(radius),
      );

  /// 仅底部圆角
  static BorderRadius bottom(double radius) => BorderRadius.vertical(
        bottom: Radius.circular(radius),
      );

  /// 仅左侧圆角
  static BorderRadius left(double radius) => BorderRadius.horizontal(
        left: Radius.circular(radius),
      );

  /// 仅右侧圆角
  static BorderRadius right(double radius) => BorderRadius.horizontal(
        right: Radius.circular(radius),
      );
}
