import 'dart:collection';

import 'package:native_app/shared/widgets/message/message_type.dart';

/// 消息入队模式
enum MessageQueueMode {
  /// 加入队列，依次展示（默认）
  queue,

  /// 立即替换当前提示
  replaceCurrent,
}

/// 消息队列管理回调
typedef OnMessageChanged = void Function(MessageData? current);

/// 消息队列管理器
///
/// 负责管理消息的入队、出队和依次展示。
/// 当一条消息正在展示时，新消息将进入队列等待。
///
/// 支持两种入队模式：
/// - [MessageQueueMode.queue]：加入队列等待（默认）
/// - [MessageQueueMode.replaceCurrent]：立即替换当前正在展示的消息
class MessageQueue {
  MessageQueue({this.maxQueueSize = 5});

  /// 最大队列长度（防止无限堆积）
  final int maxQueueSize;

  /// 内部队列
  final Queue<MessageData> _queue = Queue<MessageData>();

  /// 当前正在展示的消息
  MessageData? _current;

  /// 当前消息变化回调
  OnMessageChanged? onMessageChanged;

  /// 当前正在展示的消息
  MessageData? get current => _current;

  /// 队列中等待的消息数量
  int get pendingCount => _queue.length;

  /// 是否正在展示消息
  bool get isShowing => _current != null;

  /// 入队一条消息
  ///
  /// 根据 [mode] 决定是排队还是立即替换：
  /// - [MessageQueueMode.queue]：如果当前有消息在展示，则加入队列等待
  /// - [MessageQueueMode.replaceCurrent]：立即替换当前消息，清空队列
  void enqueue(MessageData data, {MessageQueueMode mode = MessageQueueMode.queue}) {
    switch (mode) {
      case MessageQueueMode.queue:
        if (_current == null) {
          _show(data);
        } else {
          // 防止队列过长
          if (_queue.length >= maxQueueSize) {
            _queue.removeFirst();
          }
          _queue.addLast(data);
        }
        break;

      case MessageQueueMode.replaceCurrent:
        _queue.clear();
        _show(data);
        break;
    }
  }

  /// 展示一条消息
  void _show(MessageData data) {
    _current = data;
    onMessageChanged?.call(_current);
  }

  /// 当前消息已关闭，取出下一条
  ///
  /// 如果队列中有等待的消息，返回下一条并设为当前。
  /// 如果队列为空，清除当前消息。
  MessageData? next() {
    if (_queue.isNotEmpty) {
      _current = _queue.removeFirst();
      onMessageChanged?.call(_current);
      return _current;
    }
    _current = null;
    onMessageChanged?.call(null);
    return null;
  }

  /// 清空队列并关闭当前消息
  void clear() {
    _queue.clear();
    _current = null;
    onMessageChanged?.call(null);
  }

  /// 仅清空等待队列（不影响当前消息）
  void clearPending() {
    _queue.clear();
  }
}
