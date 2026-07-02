import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/config/theme/app_spacing.dart';

import '../view_model/change_password_view_model.dart';
import '../view_model/user_provider.dart';

/// 修改密码页
class ChangePasswordPage extends ConsumerStatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  ConsumerState<ChangePasswordPage> createState() =>
      _ChangePasswordPageState();
}

class _ChangePasswordPageState extends ConsumerState<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();

  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateOldPassword(String? value) {
    if (value == null || value.isEmpty) return '请输入原密码';
    return null;
  }

  String? _validateNewPassword(String? value) {
    if (value == null || value.isEmpty) return '请输入新密码';
    if (value.length < 6) return '密码至少 6 位';
    if (value == _oldPasswordController.text) return '新密码不能与原密码相同';
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) return '请确认新密码';
    if (value != _newPasswordController.text) return '两次输入的密码不一致';
    return null;
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref
        .read(changePasswordViewModelProvider.notifier)
        .changePassword(
          _oldPasswordController.text,
          _newPasswordController.text,
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('密码修改成功'),
          duration: Duration(seconds: 2),
        ),
      );
      context.pop();
    } else if (mounted) {
      final errorMessage =
          ref.read(changePasswordViewModelProvider).errorMessage;
      if (errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(changePasswordViewModelProvider);

    ref.listen<ChangePasswordState>(
      changePasswordViewModelProvider,
      (prev, next) {
        if (next.errorMessage != null &&
            next.errorMessage != prev?.errorMessage) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              duration: const Duration(seconds: 3),
            ),
          );
        }
      },
    );

    return Scaffold(
      appBar: AppBar(title: const Text('修改密码')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.pageHorizontal,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              SizedBox(height: AppSpacing.xxl),
              TextFormField(
                controller: _oldPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '原密码',
                  prefixIcon: Icon(Icons.lock),
                ),
                validator: _validateOldPassword,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              TextFormField(
                controller: _newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '新密码',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: _validateNewPassword,
              ),
              SizedBox(height: AppSpacing.formFieldSpacing),
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: '确认新密码',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: _validateConfirmPassword,
              ),
              SizedBox(height: AppSpacing.xl),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: state.isLoading ? null : _changePassword,
                  child: state.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('确认修改'),
                ),
              ),
              SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}
