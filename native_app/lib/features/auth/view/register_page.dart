import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/config/theme/app_radius.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/shared/widgets/message/message.dart';
import 'package:native_app/widgets/sms_code_input.dart';

import '../view_model/auth_provider.dart';
import '../view_model/register_view_model.dart';

/// 注册页
/// 基于科研工作台设计稿：Banner + 下方表单，上下排布
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();

  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreedToTerms = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) return '请输入手机号';
    if (!RegExp(r'^1[3-9]\d{9}$').hasMatch(value)) return '手机号格式不正确';
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

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreedToTerms) {
      AppMessage.warning('请先阅读并同意用户协议和隐私政策');
      return;
    }

    final success = await ref
        .read(registerViewModelProvider.notifier)
        .register(
          _phoneController.text,
          _passwordController.text,
          _codeController.text,
        );

    if (!success && mounted) {
      final errorMessage = ref.read(registerViewModelProvider).errorMessage;
      if (errorMessage != null) {
        AppMessage.error(errorMessage);
      }
    }
  }

  void _showError(String? message) {
    if (message == null) return;
    AppMessage.error(message);
  }

  @override
  Widget build(BuildContext context) {
    final registerState = ref.watch(registerViewModelProvider);

    ref.listen<RegisterState>(registerViewModelProvider, (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        _showError(next.errorMessage);
      }
    });

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          _buildBrandingSection(),
          Expanded(child: _buildRegisterCard(registerState.isLoading)),
        ],
      ),
    );
  }

  /// Banner 区域 - 背景图延伸到状态栏 + 返回按钮 + 标语
  Widget _buildBrandingSection() {
    final statusBarHeight = MediaQuery.paddingOf(context).top;
    return SizedBox(
      height: 220 + statusBarHeight,
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/register_bg.png',
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
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_back,
                      color: AppColors.darkText,
                      size: 24,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '创建账号',
                  style: AppTypography.titleLarge.copyWith(
                    color: AppColors.darkText,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                Text(
                  '加入科研工作平台，开启高效科研之旅',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.secondaryText,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 注册表单区域
  Widget _buildRegisterCard(bool isLoading) {
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
                '欢迎注册科研工作台',
                style: AppTypography.titleLarge.copyWith(
                  color: AppColors.darkText,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: AppSpacing.xs),
              Text(
                '填写信息完成注册',
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.secondaryText,
                ),
              ),
              SizedBox(height: AppSpacing.md),
              _buildInputField(
                controller: _phoneController,
                hintText: '请输入手机号',
                icon: Icons.smartphone_outlined,
                keyboardType: TextInputType.phone,
                validator: _validatePhone,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              SmsCodeInput(
                codeController: _codeController,
                phoneController: _phoneController,
                scene: 'REGISTER',
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              _buildInputField(
                controller: _passwordController,
                hintText: '请设置密码（8-20位，包含字母和数字）',
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
              Row(
                children: [
                  GestureDetector(
                    onTap: () =>
                        setState(() => _agreedToTerms = !_agreedToTerms),
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _agreedToTerms
                              ? AppColors.primary
                              : AppColors.outlineVariant,
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(4),
                        color: _agreedToTerms
                            ? AppColors.primary
                            : Colors.transparent,
                      ),
                      child: _agreedToTerms
                          ? const Icon(Icons.check, size: 12, color: Colors.white)
                          : null,
                    ),
                  ),
                  SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        text: '我已阅读并同意',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.secondaryText,
                        ),
                        children: [
                          TextSpan(
                            text: '《用户协议》',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                          TextSpan(
                            text: '和',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.secondaryText,
                            ),
                          ),
                          TextSpan(
                            text: '《隐私政策》',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: isLoading ? null : _register,
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
                          '立即注册',
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
                    '已有账号？',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.secondaryText,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text(
                      '立即登录',
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
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: AppTypography.bodyLarge.copyWith(
        color: AppColors.darkText,
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
      validator: validator,
    );
  }
}
