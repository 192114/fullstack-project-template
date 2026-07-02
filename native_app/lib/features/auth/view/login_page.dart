import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/widgets/sms_code_input.dart';

import '../view_model/auth_provider.dart';
import '../view_model/login_view_model.dart';

/// 登录页
/// 支持密码登录和验证码登录双 Tab
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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

    final success = await ref
        .read(loginViewModelProvider.notifier)
        .loginByPassword(_phoneController.text, _passwordController.text);

    if (!success && mounted) {
      _showError(ref.read(loginViewModelProvider).errorMessage);
    }
  }

  Future<void> _loginBySms() async {
    if (!_smsFormKey.currentState!.validate()) return;

    final success = await ref
        .read(loginViewModelProvider.notifier)
        .loginBySms(_smsPhoneController.text, _smsCodeController.text);

    if (!success && mounted) {
      _showError(ref.read(loginViewModelProvider).errorMessage);
    }
  }

  void _showError(String? message) {
    if (message == null) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
      ),
    );
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
      appBar: AppBar(title: const Text('登录')),
      body: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.pageHorizontal,
        ),
        child: Column(
          children: [
            TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: '密码登录'),
                Tab(text: '验证码登录'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildPasswordTab(loginState.isLoading),
                  _buildSmsTab(loginState.isLoading),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordTab(bool isLoading) {
    return Form(
      key: _passwordFormKey,
      child: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: AppSpacing.xxl),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: '手机号',
                prefixIcon: Icon(Icons.phone),
              ),
              validator: _validatePhone,
            ),
            SizedBox(height: AppSpacing.formFieldSpacing),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: '密码',
                prefixIcon: Icon(Icons.lock),
              ),
              validator: _validatePassword,
            ),
            SizedBox(height: AppSpacing.md),
            Row(
              children: [
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/reset-password'),
                  child: const Text('忘记密码？'),
                ),
              ],
            ),
            SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isLoading ? null : _loginByPassword,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('登录'),
              ),
            ),
            SizedBox(height: AppSpacing.xl),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('还没账号？'),
                TextButton(
                  onPressed: () => context.go('/register'),
                  child: const Text('去注册'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmsTab(bool isLoading) {
    return Form(
      key: _smsFormKey,
      child: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: AppSpacing.xxl),
            TextFormField(
              controller: _smsPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: '手机号',
                prefixIcon: Icon(Icons.phone),
              ),
              validator: _validatePhone,
            ),
            SizedBox(height: AppSpacing.formFieldSpacing),
            SmsCodeInput(
              phone: _smsPhoneController.text,
              scene: 'LOGIN',
              onCodeChanged: (code) => _smsCodeController.text = code,
            ),
            SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isLoading ? null : _loginBySms,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('登录'),
              ),
            ),
            SizedBox(height: AppSpacing.xl),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('还没账号？'),
                TextButton(
                  onPressed: () => context.go('/register'),
                  child: const Text('去注册'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
