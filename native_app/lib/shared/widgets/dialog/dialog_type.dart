import 'package:flutter/material.dart';

/// 对话框类型
///
/// 支持六种类型，前四种与 [MessageType] 对应，
/// [question] 用于确认类弹窗，[danger] 用于危险操作确认。
enum DialogType {
  /// 信息 - 蓝色图标
  info,

  /// 成功 - 绿色图标
  success,

  /// 警告 - 黄色图标
  warning,

  /// 错误 - 红色图标
  error,

  /// 确认 - 蓝色问号图标
  question,

  /// 危险 - 红色问号图标
  danger,
}

/// 按钮样式
enum DialogActionStyle {
  /// 主按钮 - 主色填充背景
  primary,

  /// 危险按钮 - 红色填充背景
  danger,

  /// 次要按钮 - 白底描边
  secondary,
}

/// 对话框按钮
///
/// 定义对话框底部操作按钮的文本、样式和回调。
/// 提供工厂构造 [primary]、[danger]、[secondary] 快捷创建。
@immutable
class DialogAction {
  /// 按钮文本
  final String text;

  /// 按钮样式
  final DialogActionStyle style;

  /// 点击回调（可选，通常通过返回值处理）
  final VoidCallback? onTap;

  const DialogAction({
    required this.text,
    this.style = DialogActionStyle.primary,
    this.onTap,
  });

  /// 主按钮 - 主色填充
  const DialogAction.primary({required this.text, this.onTap})
      : style = DialogActionStyle.primary;

  /// 危险按钮 - 红色填充
  const DialogAction.danger({required this.text, this.onTap})
      : style = DialogActionStyle.danger;

  /// 次要按钮 - 白底描边
  const DialogAction.secondary({required this.text, this.onTap})
      : style = DialogActionStyle.secondary;
}

/// 对话框配置
///
/// 封装一个对话框的全部信息，用于控制器和 UI 渲染。
@immutable
class DialogConfig {
  /// 对话框类型
  final DialogType type;

  /// 标题（必填）
  final String title;

  /// 描述（可选）
  final String? message;

  /// 操作按钮列表
  ///
  /// - 空列表：仅靠 [showClose] 或 [barrierDismissible] 关闭
  /// - 一个按钮：单按钮布局
  /// - 两个按钮：双按钮水平排列
  /// - 超过两个：自动垂直排列
  final List<DialogAction> actions;

  /// 是否显示右上角关闭按钮
  final bool showClose;

  /// 点击遮罩是否可关闭
  final bool barrierDismissible;

  /// 是否启用毛玻璃效果
  final bool enableBlur;

  const DialogConfig({
    required this.type,
    required this.title,
    this.message,
    this.actions = const [],
    this.showClose = false,
    this.barrierDismissible = true,
    this.enableBlur = false,
  });
}
