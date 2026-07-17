import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/config/theme/app_radius.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/core/router/app_router.dart';
import 'package:native_app/shared/widgets/message/message.dart';
import 'package:native_app/widgets/sms_code_input.dart';

import '../view_model/auth_provider.dart';
import '../view_model/resubmit_view_model.dart';

/// 重新提交审核页
/// 被驳回后用户可以修改注册信息重新提交审核
class ResubmitPage extends ConsumerStatefulWidget {
  final String phone;

  const ResubmitPage({super.key, required this.phone});

  @override
  ConsumerState<ResubmitPage> createState() => _ResubmitPageState();
}

class _ResubmitPageState extends ConsumerState<ResubmitPage> {
  final _formKey = GlobalKey<FormState>();

  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    _phoneController.text = widget.phone;
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );
    // 加载审核信息，预填昵称
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(resubmitViewModelProvider.notifier)
          .loadAuditInfo(widget.phone);
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _nicknameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateCode(String? value) {
    if (value == null || value.isEmpty) return '请输入验证码';
    if (value.length < 4) return '验证码格式不正确';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return '请设置密码';
    if (value.length < 8) return '密码至少 8 位';
    if (!RegExp(r'^(?=.*[a-zA-Z])(?=.*\d)').hasMatch(value)) {
      return '密码需包含字母和数字';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) return '请确认密码';
    if (value != _passwordController.text) return '两次输入的密码不一致';
    return null;
  }

  Future<void> _resubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final phone = await ref
        .read(resubmitViewModelProvider.notifier)
        .resubmit(
          widget.phone,
          _passwordController.text,
          _codeController.text,
          nickname: _nicknameController.text.trim().isEmpty
              ? null
              : _nicknameController.text.trim(),
        );

    if (phone != null && mounted) {
      AppMessage.success(
        '提交成功',
        description: '请等待管理员审核',
        duration: const Duration(seconds: 2),
      );
      context.pop(true);
    }
  }

  void _showError(String? message) {
    if (message == null) return;
    AppMessage.error(message);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resubmitViewModelProvider);

    // 预填昵称
    if (state.nickname != null && _nicknameController.text.isEmpty) {
      _nicknameController.text = state.nickname!;
    }

    ref.listen<ResubmitState>(resubmitViewModelProvider, (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        _showError(next.errorMessage);
      }
    });

    final isLoading = state.isLoading || state.isSubmitting;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          _buildBrandingSection(),
          Expanded(child: _buildFormCard(isLoading)),
        ],
      ),
    );
  }

  /// Banner 区域
  Widget _buildBrandingSection() {
    final statusBarHeight = MediaQuery.paddingOf(context).top;
    return SizedBox(
      height: 220 + statusBarHeight,
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/audit_bg.png',
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.pageHorizontal + 8,
              statusBarHeight + AppSpacing.md,
              AppSpacing.pageHorizontal + 8,
              AppSpacing.md,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_back,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '修改信息',
                  style: AppTypography.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                Text(
                  '修改注册信息后重新提交审核',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 表单区域
  Widget _buildFormCard(bool isLoading) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    return Container(
      width: double.infinity,
      color: Colors.white,
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.pageHorizontal + 8,
          AppSpacing.lg,
          AppSpacing.pageHorizontal + 8,
          AppSpacing.lg + bottomInset,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '重新提交注册信息',
                style: AppTypography.titleLarge.copyWith(
                  color: AppColors.darkText,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: AppSpacing.xs),
              Text(
                '请修改信息后重新提交',
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.secondaryText,
                ),
              ),
              SizedBox(height: AppSpacing.md),
              // 手机号（只读）
              _buildInputField(
                controller: _phoneController,
                hintText: '手机号',
                icon: Icons.smartphone_outlined,
                keyboardType: TextInputType.phone,
                readOnly: true,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              // 验证码
              SmsCodeInput(
                codeController: _codeController,
                phoneController: _phoneController,
                scene: 'REGISTER',
                validator: _validateCode,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              // 昵称（可编辑）
              _buildInputField(
                controller: _nicknameController,
                hintText: '请输入昵称（选填）',
                icon: Icons.person_outline,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              // 新密码
              _buildInputField(
                controller: _passwordController,
                hintText: '请设置新密码（8-20位，包含字母和数字）',
                icon: Icons.lock_outline,
                obscureText: _obscurePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.hintText,
                    size: 20,
                  ),
                  onPressed: () {
                    setState(() => _obscurePassword = !_obscurePassword);
                  },
                ),
                validator: _validatePassword,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              // 确认密码
              _buildInputField(
                controller: _confirmPasswordController,
                hintText: '请再次输入密码',
                icon: Icons.lock_outline,
                obscureText: _obscureConfirmPassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirmPassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.hintText,
                    size: 20,
                  ),
                  onPressed: () {
                    setState(() =>
                        _obscureConfirmPassword = !_obscureConfirmPassword);
                  },
                ),
                validator: _validateConfirmPassword,
              ),
              SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: isLoading ? null : _resubmit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.button),
                    ),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          '重新提交',
                          style: AppTypography.titleMedium.copyWith(
                            color: Colors.white,
                            fontSize: 16,
                            letterSpacing: 4,
                          ),
                        ),
                ),
              ),
              SizedBox(height: AppSpacing.md),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '不想修改？',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.secondaryText,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go(RoutePaths.login),
                    child: Text(
                      '返回登录',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    bool readOnly = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      readOnly: readOnly,
      style: AppTypography.bodyLarge.copyWith(
        color: readOnly ? AppColors.secondaryText : AppColors.darkText,
        fontSize: 15,
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: AppTypography.bodyLarge.copyWith(
          color: AppColors.hintText,
          fontSize: 15,
        ),
        prefixIcon: Icon(icon, color: AppColors.secondaryText, size: 22),
        suffixIcon: suffixIcon,
        helperText: ' ',
        filled: true,
        fillColor: readOnly ? AppColors.background : Colors.white,
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
      validator: validator,
    );
  }
}
