import 'package:flutter/material.dart';

/// 消息类型
///
/// 支持四种类型：[success]、[error]、[warning]、[info]
/// 每种类型对应不同的图标和配色
enum MessageType {
  /// 成功 - 绿色状态图标
  success,

  /// 错误 - 红色状态图标
  error,

  /// 警告 - 黄色状态图标
  warning,

  /// 信息 - 蓝色状态图标
  info,
}

/// 消息显示位置
enum MessagePosition {
  /// 顶部显示（默认）
  top,

  /// 底部显示
  bottom,
}

/// 消息数据模型
///
/// 封装一条消息的全部信息，用于队列管理和 UI 渲染
@immutable
class MessageData {
  /// 消息类型
  final MessageType type;

  /// 标题（必填）
  final String title;

  /// 描述（可选）
  final String? description;

  /// 自动关闭时长
  final Duration duration;

  /// 显示位置
  final MessagePosition position;

  /// 是否可手动关闭
  final bool dismissible;

  /// 是否启用毛玻璃效果
  final bool enableBlur;

  /// 唯一标识
  final int id;

  const MessageData({
    required this.type,
    required this.title,
    required this.id,
    this.description,
    this.duration = const Duration(seconds: 3),
    this.position = MessagePosition.top,
    this.dismissible = true,
    this.enableBlur = false,
  });

  /// 工厂构造 - 自动生成唯一 ID
  factory MessageData.create({
    required MessageType type,
    required String title,
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
  }) {
    return MessageData(
      type: type,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      id: DateTime.now().microsecondsSinceEpoch,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MessageData && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
