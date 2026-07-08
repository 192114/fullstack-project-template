import 'package:flutter/material.dart';

import 'package:native_app/shared/widgets/message/message_controller.dart';
import 'package:native_app/shared/widgets/message/message_queue.dart';
import 'package:native_app/shared/widgets/message/message_theme.dart';
import 'package:native_app/shared/widgets/message/message_type.dart';

export 'package:native_app/shared/widgets/message/message_type.dart';
export 'package:native_app/shared/widgets/message/message_theme.dart';
export 'package:native_app/shared/widgets/message/message_queue.dart'
    show MessageQueueMode;

/// 全局消息提示组件
///
/// 基于 [OverlayEntry] 实现的现代化消息提示，替代 Flutter 默认 SnackBar。
/// 无需传递 [BuildContext]，整个 App 任意位置均可调用。
///
/// ## 基本用法
///
/// ```dart
/// AppMessage.success("保存成功");
/// AppMessage.error("网络连接失败");
/// AppMessage.warning("请完善资料");
/// AppMessage.info("已同步最新数据");
/// ```
///
/// ## 完整用法
///
/// ```dart
/// AppMessage.show(
///   title: "保存成功",
///   description: "您的资料已经成功保存",
///   type: MessageType.success,
///   duration: Duration(seconds: 3),
///   position: MessagePosition.top,
///   dismissible: true,
/// );
/// ```
///
/// ## 队列管理
///
/// 默认情况下，多条消息会排队依次展示。
/// 使用 [replaceCurrent] 可立即替换当前消息：
///
/// ```dart
/// AppMessage.show(
///   title: "新消息",
///   type: MessageType.info,
///   replaceCurrent: true,
/// );
/// ```
///
/// ## 初始化
///
/// 需要在 [MaterialApp] 中设置 [navigatorKey] 并调用 [initialize]：
///
/// ```dart
/// MaterialApp.router(
///   navigatorKey: AppMessage.navigatorKey,
///   ...
/// );
/// ```
///
/// `navigatorKey` 会在首次使用时自动初始化控制器。
class AppMessage {
  AppMessage._();

  /// Navigator key（设置到 MaterialApp 上）
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// 控制器实例
  static final MessageController _controller = MessageController.instance;

  // ==================== 初始化 ====================

  /// 初始化消息系统
  ///
  /// 通常在 App 启动后调用，或在首次调用 [show] 时自动初始化。
  /// 如果 [navigatorKey] 已经设置到 [MaterialApp] 上，
  /// 控制器会在首次 [show] 时自动初始化。
  static void initialize() {
    _controller.initialize(navigatorKey);
  }

  /// 确保控制器已初始化
  static void _ensureInitialized() {
    _controller.initialize(navigatorKey);
  }

  // ==================== 快捷方法 ====================

  /// 展示成功消息
  ///
  /// ```dart
  /// AppMessage.success("保存成功");
  /// ```
  static void success(
    String title, {
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
    bool replaceCurrent = false,
  }) {
    _show(
      type: MessageType.success,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      replaceCurrent: replaceCurrent,
    );
  }

  /// 展示错误消息
  ///
  /// ```dart
  /// AppMessage.error("网络连接失败");
  /// ```
  static void error(
    String title, {
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
    bool replaceCurrent = false,
  }) {
    _show(
      type: MessageType.error,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      replaceCurrent: replaceCurrent,
    );
  }

  /// 展示警告消息
  ///
  /// ```dart
  /// AppMessage.warning("请完善资料");
  /// ```
  static void warning(
    String title, {
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
    bool replaceCurrent = false,
  }) {
    _show(
      type: MessageType.warning,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      replaceCurrent: replaceCurrent,
    );
  }

  /// 展示信息消息
  ///
  /// ```dart
  /// AppMessage.info("已同步最新数据");
  /// ```
  static void info(
    String title, {
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
    bool replaceCurrent = false,
  }) {
    _show(
      type: MessageType.info,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      replaceCurrent: replaceCurrent,
    );
  }

  // ==================== 完整 API ====================

  /// 展示一条消息（完整参数）
  ///
  /// ```dart
  /// AppMessage.show(
  ///   title: "保存成功",
  ///   description: "您的资料已经成功保存",
  ///   type: MessageType.success,
  ///   duration: Duration(seconds: 3),
  ///   position: MessagePosition.top,
  ///   dismissible: true,
  /// );
  /// ```
  static void show({
    required String title,
    required MessageType type,
    String? description,
    Duration duration = const Duration(seconds: 3),
    MessagePosition position = MessagePosition.top,
    bool dismissible = true,
    bool enableBlur = false,
    bool replaceCurrent = false,
  }) {
    _show(
      type: type,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
      replaceCurrent: replaceCurrent,
    );
  }

  // ==================== 内部方法 ====================

  static void _show({
    required MessageType type,
    required String title,
    String? description,
    required Duration duration,
    required MessagePosition position,
    required bool dismissible,
    required bool enableBlur,
    required bool replaceCurrent,
  }) {
    _ensureInitialized();

    final data = MessageData.create(
      type: type,
      title: title,
      description: description,
      duration: duration,
      position: position,
      dismissible: dismissible,
      enableBlur: enableBlur,
    );

    _controller.show(
      data,
      mode: replaceCurrent
          ? MessageQueueMode.replaceCurrent
          : MessageQueueMode.queue,
    );
  }

  // ==================== 控制方法 ====================

  /// 立即关闭当前正在展示的消息
  static void dismissCurrent() {
    _controller.dismissCurrent();
  }

  /// 清空所有消息（当前展示的 + 队列中等待的）
  static void clearAll() {
    _controller.clearAll();
  }

  /// 仅清空等待队列（不影响当前正在展示的消息）
  static void clearPending() {
    _controller.clearPending();
  }

  // ==================== 主题 ====================

  /// 获取当前主题
  static MessageTheme get theme => _controller.theme;

  /// 设置主题
  ///
  /// ```dart
  /// AppMessage.setTheme(MessageTheme(
  ///   successColor: Colors.green,
  ///   ...
  /// ));
  /// ```
  static void setTheme(MessageTheme theme) {
    _controller.theme = theme;
  }
}
