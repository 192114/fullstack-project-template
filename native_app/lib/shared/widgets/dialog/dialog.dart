import 'package:native_app/shared/widgets/dialog/dialog_controller.dart';
import 'package:native_app/shared/widgets/dialog/dialog_theme.dart';
import 'package:native_app/shared/widgets/dialog/dialog_type.dart';

export 'package:native_app/shared/widgets/dialog/dialog_type.dart';
export 'package:native_app/shared/widgets/dialog/dialog_theme.dart';

/// 全局对话框组件
///
/// 基于 [OverlayEntry] 实现的现代化对话框，与 [AppMessage] 共享同一架构。
/// 无需传递 [BuildContext]，整个 App 任意位置均可调用。
///
/// ## Alert 类 — 单按钮提示
///
/// ```dart
/// await AppDialog.info(title: "提示", message: "您的操作已成功完成");
/// await AppDialog.success(title: "成功", message: "提交成功，请耐心等待审核");
/// await AppDialog.warning(title: "提示", message: "当前操作可能存在风险");
/// await AppDialog.error(title: "错误", message: "操作失败，请稍后重试");
/// ```
///
/// ## Confirm 类 — 双按钮确认
///
/// ```dart
/// final ok = await AppDialog.confirm(
///   title: "确认操作",
///   message: "确定要提交此申请吗？",
/// );
/// if (ok) { /* 用户点击了确认 */ }
///
/// final deleted = await AppDialog.danger(
///   title: "确认删除",
///   message: "确定要删除该数据吗？删除后将无法恢复",
///   confirmText: "删除",
/// );
/// ```
///
/// ## 自定义 — 完全控制
///
/// ```dart
/// final index = await AppDialog.show(
///   type: DialogType.info,
///   title: "发现新版本 V2.3.0",
///   message: "体验更流畅的功能和性能优化",
///   actions: [
///     DialogAction.secondary(text: "稍后再试"),
///     DialogAction.primary(text: "立即更新"),
///   ],
///   showClose: false,
///   barrierDismissible: true,
/// );
/// ```
class AppDialog {
  AppDialog._();

  /// 控制器实例
  static final DialogController _controller = DialogController.instance;

  // ==================== Alert 类 ====================

  /// 信息提示 — 单按钮"知道了"
  static Future<void> info({
    required String title,
    String? message,
    String buttonText = '知道了',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) {
    return _controller.show<void>(
      DialogConfig(
        type: DialogType.info,
        title: title,
        message: message,
        actions: [DialogAction.primary(text: buttonText)],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
  }

  /// 成功提示 — 单按钮"知道了"
  static Future<void> success({
    required String title,
    String? message,
    String buttonText = '知道了',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) {
    return _controller.show<void>(
      DialogConfig(
        type: DialogType.success,
        title: title,
        message: message,
        actions: [DialogAction.primary(text: buttonText)],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
  }

  /// 警告提示 — 单按钮"知道了"
  static Future<void> warning({
    required String title,
    String? message,
    String buttonText = '知道了',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) {
    return _controller.show<void>(
      DialogConfig(
        type: DialogType.warning,
        title: title,
        message: message,
        actions: [DialogAction.primary(text: buttonText)],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
  }

  /// 错误提示 — 单按钮"知道了"
  static Future<void> error({
    required String title,
    String? message,
    String buttonText = '知道了',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) {
    return _controller.show<void>(
      DialogConfig(
        type: DialogType.error,
        title: title,
        message: message,
        actions: [DialogAction.primary(text: buttonText)],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
  }

  // ==================== Confirm 类 ====================

  /// 基础确认 — 双按钮，返回是否确认
  ///
  /// ```dart
  /// final ok = await AppDialog.confirm(
  ///   title: "确认操作",
  ///   message: "确定要提交此申请吗？",
  /// );
  /// ```
  static Future<bool> confirm({
    required String title,
    String? message,
    String cancelText = '取消',
    String confirmText = '确认',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) async {
    final result = await _controller.show<int>(
      DialogConfig(
        type: DialogType.question,
        title: title,
        message: message,
        actions: [
          DialogAction.secondary(text: cancelText),
          DialogAction.primary(text: confirmText),
        ],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
    // result == 1 表示点击了确认按钮
    return result == 1;
  }

  /// 危险操作确认 — 双按钮，确认按钮为红色
  ///
  /// ```dart
  /// final deleted = await AppDialog.danger(
  ///   title: "确认删除",
  ///   message: "确定要删除该数据吗？删除后将无法恢复",
  ///   confirmText: "删除",
  /// );
  /// ```
  static Future<bool> danger({
    required String title,
    String? message,
    String cancelText = '取消',
    String confirmText = '删除',
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) async {
    final result = await _controller.show<int>(
      DialogConfig(
        type: DialogType.danger,
        title: title,
        message: message,
        actions: [
          DialogAction.secondary(text: cancelText),
          DialogAction.danger(text: confirmText),
        ],
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
    return result == 1;
  }

  // ==================== 自定义 ====================

  /// 自定义对话框 — 返回点击的按钮索引
  ///
  /// - 返回 `null`：遮罩关闭或关闭按钮关闭
  /// - 返回 `int`：点击的按钮索引（从 0 开始）
  ///
  /// ```dart
  /// final index = await AppDialog.show(
  ///   type: DialogType.info,
  ///   title: "发现新版本 V2.3.0",
  ///   message: "体验更流畅的功能和性能优化",
  ///   actions: [
  ///     DialogAction.secondary(text: "稍后再试"),
  ///     DialogAction.primary(text: "立即更新"),
  ///   ],
  /// );
  /// ```
  static Future<int?> show({
    required String title,
    DialogType type = DialogType.info,
    String? message,
    List<DialogAction> actions = const [],
    bool showClose = false,
    bool barrierDismissible = true,
    bool enableBlur = false,
  }) {
    return _controller.show<int>(
      DialogConfig(
        type: type,
        title: title,
        message: message,
        actions: actions,
        showClose: showClose,
        barrierDismissible: barrierDismissible,
        enableBlur: enableBlur,
      ),
    );
  }

  // ==================== 控制方法 ====================

  /// 立即关闭当前对话框
  static void dismiss() {
    _controller.dismiss();
  }

  // ==================== 主题 ====================

  /// 获取当前主题
  static AppDialogTheme get theme => _controller.theme;

  /// 设置主题
  static void setTheme(AppDialogTheme theme) {
    _controller.theme = theme;
  }
}
