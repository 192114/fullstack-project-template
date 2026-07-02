import 'package:flutter/material.dart';

/// 应用间距常量
/// 基于 4px 栅格系统，统一间距和 padding
class AppSpacing {
  AppSpacing._();

  // ==================== 基础间距 ====================
  /// 4px - 超小间距
  static const double xs = 4;

  /// 8px - 小间距
  static const double sm = 8;

  /// 12px - 中小间距
  static const double md = 12;

  /// 16px - 中间距
  static const double lg = 16;

  /// 20px - 中大间距
  static const double xl = 20;

  /// 24px - 大间距
  static const double xxl = 24;

  /// 32px - 超大间距
  static const double xxxl = 32;

  /// 48px - 特大间距
  static const double xxxxl = 48;

  // ==================== 页面级 Padding ====================
  /// 页面水平内边距
  static const double pageHorizontal = 16;

  /// 页面垂直内边距
  static const double pageVertical = 16;

  /// 页面标准内边距 (水平 + 垂直)
  static const EdgeInsets pagePadding = EdgeInsets.symmetric(
    horizontal: pageHorizontal,
    vertical: pageVertical,
  );

  /// 页面水平内边距
  static const EdgeInsets pageHorizontalPadding = EdgeInsets.symmetric(
    horizontal: pageHorizontal,
  );

  // ==================== 组件间距 ====================
  /// 列表项之间的间距
  static const double listItemSpacing = 12;

  /// 表单字段之间的间距
  static const double formFieldSpacing = 16;

  /// 卡片内边距
  static const double cardPadding = 16;

  /// 按钮内边距
  static const double buttonPadding = 16;

  /// 图标与文字之间的间距
  static const double iconTextSpacing = 8;

  // ==================== 快捷方法 ====================
  /// 对称间距
  static EdgeInsets all(double value) => EdgeInsets.all(value);

  /// 水平对称间距
  static EdgeInsets horizontal(double value) =>
      EdgeInsets.symmetric(horizontal: value);

  /// 垂直对称间距
  static EdgeInsets vertical(double value) =>
      EdgeInsets.symmetric(vertical: value);

  /// 自定义间距
  static EdgeInsets only({
    double left = 0,
    double top = 0,
    double right = 0,
    double bottom = 0,
  }) =>
      EdgeInsets.only(left: left, top: top, right: right, bottom: bottom);
}
