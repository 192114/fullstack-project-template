import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:native_app/config/theme/app_colors.dart';
import 'package:native_app/config/theme/app_spacing.dart';
import 'package:native_app/config/theme/app_typography.dart';
import 'package:native_app/shared/widgets/message/message.dart';

import '../models/user_model.dart';
import '../view_model/profile_view_model.dart';
import '../view_model/user_provider.dart';

/// 个人资料页
class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  /// 手机号脱敏
  String _maskPhone(String phone) {
    if (phone.length == 11) {
      return '${phone.substring(0, 3)}****${phone.substring(7)}';
    }
    return phone;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(profileViewModelProvider);

    ref.listen<ProfileState>(profileViewModelProvider, (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        AppMessage.error(next.errorMessage!);
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('个人资料'),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.user == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('加载失败'),
                      SizedBox(height: AppSpacing.md),
                      TextButton(
                        onPressed: () => ref
                            .read(profileViewModelProvider.notifier)
                            .build(),
                        child: const Text('重试'),
                      ),
                    ],
                  ),
                )
              : _buildContent(context, ref, state),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    ProfileState state,
  ) {
    final user = state.user!;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.pageHorizontal,
      ),
      child: Column(
        children: [
          SizedBox(height: AppSpacing.xxl),
          CircleAvatar(
            radius: 48,
            backgroundColor: AppColors.primaryContainer,
            child: Text(
              (user.nickname ?? user.phone).substring(0, 1),
              style: AppTypography.headlineMedium.copyWith(
                color: AppColors.onPrimaryContainer,
              ),
            ),
          ),
          SizedBox(height: AppSpacing.xxl),
          ListTile(
            leading: const Icon(Icons.phone),
            title: const Text('手机号'),
            trailing: Text(
              _maskPhone(user.phone),
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('用户名'),
            trailing: Text(
              user.username ?? '未设置',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.badge),
            title: const Text('昵称'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  user.nickname ?? '未设置',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                SizedBox(width: AppSpacing.xs),
                const Icon(Icons.chevron_right, size: 20),
              ],
            ),
            onTap: () => _showEditDialog(
              context,
              ref,
              '编辑昵称',
              user.nickname ?? '',
              (value) async {
                await ref.read(profileViewModelProvider.notifier).updateProfile(
                      UpdateProfileRequest(nickname: value),
                    );
              },
            ),
          ),
          ListTile(
            leading: const Icon(Icons.email),
            title: const Text('邮箱'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  user.email ?? '未设置',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                SizedBox(width: AppSpacing.xs),
                const Icon(Icons.chevron_right, size: 20),
              ],
            ),
            onTap: () => _showEditDialog(
              context,
              ref,
              '编辑邮箱',
              user.email ?? '',
              (value) async {
                await ref.read(profileViewModelProvider.notifier).updateProfile(
                      UpdateProfileRequest(email: value),
                    );
              },
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('修改密码'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/change-password'),
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text(
              '退出登录',
              style: TextStyle(color: AppColors.error),
            ),
            onTap: () => _showLogoutConfirm(context, ref),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(
    BuildContext context,
    WidgetRef ref,
    String title,
    String initialValue,
    Future<void> Function(String) onSave,
  ) {
    final controller = TextEditingController(text: initialValue);
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await onSave(controller.text);
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
  }

  void _showLogoutConfirm(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('退出登录'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('取消'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            onPressed: () async {
              Navigator.pop(dialogContext);
              await ref.read(profileViewModelProvider.notifier).logout();
            },
            child: const Text('退出'),
          ),
        ],
      ),
    );
  }
}
