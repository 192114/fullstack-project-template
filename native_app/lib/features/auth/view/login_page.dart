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
import '../view_model/login_view_model.dart';

/// 登录页
/// 基于科研工作台设计稿：背景图 + 品牌区 + 底部白色登录卡片
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _passwordFormKey = GlobalKey<FormState>();
  final _smsFormKey = GlobalKey<FormState>();

  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _smsPhoneController = TextEditingController();
  final _smsCodeController = TextEditingController();

  bool _rememberPassword = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
    _tabController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _smsPhoneController.dispose();
    _smsCodeController.dispose();
    super.dispose();
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) return '请输入手机号';
    if (!RegExp(r'^1[3-9]\d{9}$').hasMatch(value)) return '手机号格式不正确';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return '请输入密码';
    if (value.length < 6) return '密码至少 6 位';
    return null;
  }

  Future<void> _loginByPassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    await ref
        .read(loginViewModelProvider.notifier)
        .loginByPassword(_phoneController.text, _passwordController.text);
    // 错误提示由 ref.listen 统一处理，避免重复弹出 SnackBar
  }

  Future<void> _loginBySms() async {
    if (!_smsFormKey.currentState!.validate()) return;

    await ref
        .read(loginViewModelProvider.notifier)
        .loginBySms(_smsPhoneController.text, _smsCodeController.text);
    // 错误提示由 ref.listen 统一处理，避免重复弹出 SnackBar
  }

  void _showError(String? message) {
    if (message == null) return;
    AppMessage.error(message);
  }

  @override
  Widget build(BuildContext context) {
    final loginState = ref.watch(loginViewModelProvider);

    ref.listen<LoginState>(loginViewModelProvider, (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        _showError(next.errorMessage);
      }
    });

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset('assets/images/login_bg.png', fit: BoxFit.cover),
          ),
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                Expanded(child: _buildBrandingSection()),
                _buildLoginCard(loginState.isLoading),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrandingSection() {
    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.pageHorizontal,
        right: AppSpacing.pageHorizontal,
        top: AppSpacing.xxl,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(Icons.hexagon, color: AppColors.primary, size: 28),
                ),
                SizedBox(width: AppSpacing.sm),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '科研工作台',
                      style: AppTypography.titleMedium.copyWith(
                        color: AppColors.darkText,
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      'RESEARCH WORKBENCH',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.secondaryText,
                        fontSize: 10,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: AppSpacing.xxxxl),
            Text(
              '科研 · 高效\n协同 · 创新',
              style: AppTypography.headlineMedium.copyWith(
                color: AppColors.darkText,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              '探索生命科学的无限可能',
              style: AppTypography.bodyLarge.copyWith(
                color: AppColors.secondaryText,
              ),
            ),
            SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginCard(bool isLoading) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.xxl),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.pageHorizontal + 8,
          AppSpacing.lg,
          AppSpacing.pageHorizontal + 8,
          AppSpacing.lg + bottomInset,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '欢迎登录科研工作台',
              style: AppTypography.titleLarge.copyWith(
                color: AppColors.darkText,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: AppSpacing.xs),
            Text(
              '登录后体验更多功能',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.secondaryText,
              ),
            ),
            SizedBox(height: AppSpacing.md),
            _buildTabBar(),
            SizedBox(height: AppSpacing.md),
            SizedBox(
              height: 200,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildPasswordForm(isLoading),
                  _buildSmsForm(isLoading),
                ],
              ),
            ),
            SizedBox(height: AppSpacing.xs),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: isLoading ? null : _onLoginTap,
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
                        '登 录',
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
                  '还没有账号？',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.secondaryText,
                  ),
                ),
                GestureDetector(
                  onTap: () => context.push(RoutePaths.register),
                  child: Text(
                    '立即注册',
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
    );
  }

  Widget _buildTabBar() {
    return TabBar(
      controller: _tabController,
      indicatorColor: AppColors.primary,
      indicatorWeight: 3,
      indicatorSize: TabBarIndicatorSize.label,
      labelColor: AppColors.primary,
      labelStyle: AppTypography.titleSmall.copyWith(
        fontWeight: FontWeight.w600,
        fontSize: 15,
      ),
      unselectedLabelColor: AppColors.secondaryText,
      unselectedLabelStyle: AppTypography.titleSmall.copyWith(
        fontWeight: FontWeight.w400,
        fontSize: 15,
      ),
      dividerColor: Colors.transparent,
      tabs: const [
        Tab(text: '密码登录', height: 44),
        Tab(text: '验证码登录', height: 44),
      ],
    );
  }

  Widget _buildPasswordForm(bool isLoading) {
    return Form(
      key: _passwordFormKey,
      child: Column(
        children: [
          _buildInputField(
            controller: _phoneController,
            hintText: '请输入手机号',
            icon: Icons.smartphone_outlined,
            keyboardType: TextInputType.phone,
            validator: _validatePhone,
          ),
          SizedBox(height: AppSpacing.formFieldSpacing),
          _buildInputField(
            controller: _passwordController,
            hintText: '请输入密码',
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
          SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              GestureDetector(
                onTap: () =>
                    setState(() => _rememberPassword = !_rememberPassword),
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _rememberPassword
                              ? AppColors.primary
                              : AppColors.outlineVariant,
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(4),
                        color: _rememberPassword
                            ? AppColors.primary
                            : Colors.transparent,
                      ),
                      child: _rememberPassword
                          ? const Icon(Icons.check, size: 12, color: Colors.white)
                          : null,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Text(
                      '记住密码',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => context.push(RoutePaths.resetPassword),
                child: Text(
                  '忘记密码？',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmsForm(bool isLoading) {
    return Form(
      key: _smsFormKey,
      child: Column(
        children: [
          _buildInputField(
            controller: _smsPhoneController,
            hintText: '请输入手机号',
            icon: Icons.smartphone_outlined,
            keyboardType: TextInputType.phone,
            validator: _validatePhone,
          ),
          SizedBox(height: AppSpacing.formFieldSpacing),
          SmsCodeInput(
            codeController: _smsCodeController,
            phoneController: _smsPhoneController,
            scene: 'LOGIN',
          ),
        ],
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

  void _onLoginTap() {
    if (_tabController.index == 0) {
      _loginByPassword();
    } else {
      _loginBySms();
    }
  }
}
