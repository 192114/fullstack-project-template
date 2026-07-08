import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/config/theme/app_radius.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';
import 'package:native_app/shared/widgets/message/message.dart';

/// 短信验证码输入组件
/// 包含验证码输入框和发送验证码按钮（60 秒倒计时）
/// 使用外部传入的 codeController 和 phoneController，避免双控制器同步问题
class SmsCodeInput extends ConsumerStatefulWidget {
  /// 验证码控制器（由父页面提供）
  final TextEditingController codeController;

  /// 手机号控制器（由父页面提供，用于读取手机号和监听变化）
  final TextEditingController phoneController;

  /// 场景: LOGIN / REGISTER / RESET_PASSWORD
  final String scene;

  /// 提示文字
  final String hintText;

  /// 表单校验器
  final String? Function(String?)? validator;

  const SmsCodeInput({
    super.key,
    required this.codeController,
    required this.phoneController,
    required this.scene,
    this.hintText = '请输入验证码',
    this.validator,
  });

  @override
  ConsumerState<SmsCodeInput> createState() => _SmsCodeInputState();
}

class _SmsCodeInputState extends ConsumerState<SmsCodeInput> {
  Timer? _timer;
  int _countdown = 0;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    widget.phoneController.addListener(_onPhoneChanged);
  }

  @override
  void dispose() {
    widget.phoneController.removeListener(_onPhoneChanged);
    _timer?.cancel();
    super.dispose();
  }

  void _onPhoneChanged() {
    if (mounted) setState(() {});
  }

  /// 当前手机号
  String get _phone => widget.phoneController.text;

  /// 校验手机号格式
  bool get _isValidPhone {
    return RegExp(r'^1[3-9]\d{9}$').hasMatch(_phone);
  }

  /// 发送验证码
  Future<void> _sendCode() async {
    if (!_isValidPhone || _countdown > 0 || _isSending) return;

    setState(() => _isSending = true);

    try {
      await ref
          .read(authRepositoryProvider)
          .sendCode(_phone, widget.scene);
      _startCountdown();
      AppMessage.success('验证码已发送', duration: const Duration(seconds: 2));
    } on ApiException catch (e) {
      AppMessage.error(e.message);
    } catch (e) {
      AppMessage.error('发送验证码失败', description: '$e');
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  /// 启动 60 秒倒计时
  void _startCountdown() {
    setState(() => _countdown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _countdown--;
          if (_countdown <= 0) {
            timer.cancel();
          }
        });
      } else {
        timer.cancel();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final canSend = _isValidPhone && _countdown == 0 && !_isSending;

    return TextFormField(
      controller: widget.codeController,
      keyboardType: TextInputType.number,
      maxLength: 6,
      style: AppTypography.bodyLarge.copyWith(
        color: AppColors.darkText,
        fontSize: 15,
      ),
      decoration: InputDecoration(
        hintText: widget.hintText,
        hintStyle: AppTypography.bodyLarge.copyWith(
          color: AppColors.hintText,
          fontSize: 15,
        ),
        counterText: '',
        prefixIcon: Icon(
          Icons.shield_outlined,
          color: AppColors.secondaryText,
          size: 22,
        ),
        suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: IgnorePointer(
          ignoring: !canSend,
          child: GestureDetector(
            onTap: _sendCode,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.only(right: 16, left: 8),
              child: _isSending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    )
                  : Text(
                      _countdown > 0 ? '${_countdown}s后重发' : '获取验证码',
                      style: AppTypography.bodyMedium.copyWith(
                        color: canSend
                            ? AppColors.primary
                            : AppColors.hintText,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
            ),
          ),
        ),
        filled: true,
        helperText: ' ',
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.inputField),
          borderSide: BorderSide(color: AppColors.inputBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.inputField),
          borderSide: BorderSide(color: AppColors.inputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.inputField),
          borderSide: BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.inputField),
          borderSide: BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.inputField),
          borderSide: BorderSide(color: AppColors.error, width: 1.5),
        ),
      ),
      validator: widget.validator,
    );
  }
}
