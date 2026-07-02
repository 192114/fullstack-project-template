import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:native_app/config/theme/app_radius.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/core/network/api_exception.dart';
import 'package:native_app/features/auth/view_model/auth_provider.dart';

/// 短信验证码输入组件
/// 包含验证码输入框和发送验证码按钮（60 秒倒计时）
class SmsCodeInput extends ConsumerStatefulWidget {
  /// 手机号
  final String phone;

  /// 场景: LOGIN / REGISTER / RESET_PASSWORD
  final String scene;

  /// 验证码变化回调
  final ValueChanged<String> onCodeChanged;

  const SmsCodeInput({
    super.key,
    required this.phone,
    required this.scene,
    required this.onCodeChanged,
  });

  @override
  ConsumerState<SmsCodeInput> createState() => _SmsCodeInputState();
}

class _SmsCodeInputState extends ConsumerState<SmsCodeInput> {
  final TextEditingController _codeController = TextEditingController();
  Timer? _timer;
  int _countdown = 0;
  bool _isSending = false;

  @override
  void dispose() {
    _codeController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  /// 校验手机号格式
  bool get _isValidPhone {
    return RegExp(r'^1[3-9]\d{9}$').hasMatch(widget.phone);
  }

  /// 发送验证码
  Future<void> _sendCode() async {
    if (!_isValidPhone || _countdown > 0 || _isSending) return;

    setState(() => _isSending = true);

    try {
      await ref
          .read(authRepositoryProvider)
          .sendCode(widget.phone, widget.scene);
      _startCountdown();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('验证码已发送'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('发送验证码失败: $e')),
        );
      }
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
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: '验证码',
              counterText: '',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.inputField),
              ),
            ),
            onChanged: widget.onCodeChanged,
          ),
        ),
        SizedBox(width: AppSpacing.md),
        SizedBox(
          width: 120,
          child: TextButton(
            onPressed:
                (_isValidPhone && _countdown == 0 && !_isSending)
                    ? _sendCode
                    : null,
            child: _isSending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    _countdown > 0 ? '${_countdown}s 后重发' : '获取验证码',
                    style: AppTypography.labelLarge,
                  ),
          ),
        ),
      ],
    );
  }
}
