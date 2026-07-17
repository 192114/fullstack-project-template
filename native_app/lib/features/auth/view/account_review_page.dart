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

import '../view_model/account_review_view_model.dart';
import '../view_model/auth_provider.dart';

/// 审核状态页
/// 使用全屏背景图，根据审核状态显示不同 UI
class AccountReviewPage extends ConsumerStatefulWidget {
  final String phone;

  const AccountReviewPage({super.key, required this.phone});

  @override
  ConsumerState<AccountReviewPage> createState() => _AccountReviewPageState();
}

class _AccountReviewPageState extends ConsumerState<AccountReviewPage> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
    );
    // 页面加载时自动查询一次审核状态
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(accountReviewViewModelProvider.notifier)
          .refresh(widget.phone);
    });
  }

  void _showError(String? message) {
    if (message == null) return;
    AppMessage.error(message);
  }

  /// 返回登录页：优先 pop，兼容深链接无栈底页面的场景
  void _backToLogin() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(RoutePaths.login);
    }
  }

  Future<void> _refresh() async {
    await ref
        .read(accountReviewViewModelProvider.notifier)
        .refresh(widget.phone);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(accountReviewViewModelProvider);

    ref.listen<AccountReviewState>(accountReviewViewModelProvider,
        (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        _showError(next.errorMessage);
      }
    });

    return Scaffold(
      body: Stack(
        children: [
          // 全屏背景图
          Positioned.fill(
            child: Image.asset(
              'assets/images/audit_bg.png',
              fit: BoxFit.cover,
            ),
          ),
          // 内容层
          SafeArea(
            child: Column(
              children: [
                _buildAppBar(),
                Expanded(
                  child: state.isLoading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        )
                      : _buildContent(state),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.pageHorizontal + 8,
        AppSpacing.md,
        AppSpacing.pageHorizontal + 8,
        AppSpacing.md,
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _backToLogin,
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
        ],
      ),
    );
  }

  Widget _buildContent(AccountReviewState state) {
    // 0=待审核, 1=已通过, 2=已驳回
    switch (state.auditStatus) {
      case 0:
        return _buildPendingView(state);
      case 1:
        return _buildApprovedView(state);
      case 2:
        return _buildRejectedView(state);
      default:
        return _buildPendingView(state);
    }
  }

  /// 待审核视图
  Widget _buildPendingView(AccountReviewState state) {
    return _buildStatusView(
      icon: Icons.hourglass_top,
      iconColor: const Color(0xFF2196F3),
      title: '审核中',
      subtitle: '您的注册申请正在审核中，请耐心等待',
      infoItems: [
        _InfoItem(label: '手机号', value: state.phone ?? widget.phone),
        if (state.nickname != null)
          _InfoItem(label: '昵称', value: state.nickname!),
        if (state.createTime != null)
          _InfoItem(label: '提交时间', value: state.createTime!),
      ],
      actions: [
        _buildButton(
          text: '刷新状态',
          onPressed: _refresh,
          isPrimary: true,
        ),
        _buildButton(
          text: '返回登录',
          onPressed: _backToLogin,
          isPrimary: false,
        ),
      ],
    );
  }

  /// 已通过视图
  Widget _buildApprovedView(AccountReviewState state) {
    return _buildStatusView(
      icon: Icons.check_circle,
      iconColor: const Color(0xFF4CAF50),
      title: '审核通过',
      subtitle: '恭喜！您的账号已通过审核，可以登录了',
      infoItems: [
        _InfoItem(label: '手机号', value: state.phone ?? widget.phone),
        if (state.nickname != null)
          _InfoItem(label: '昵称', value: state.nickname!),
      ],
      actions: [
        _buildButton(
          text: '去登录',
          onPressed: _backToLogin,
          isPrimary: true,
        ),
      ],
    );
  }

  /// 已驳回视图
  Widget _buildRejectedView(AccountReviewState state) {
    return _buildStatusView(
      icon: Icons.cancel,
      iconColor: const Color(0xFFFF5252),
      title: '审核未通过',
      subtitle: '很遗憾，您的注册申请未通过审核',
      infoItems: [
        _InfoItem(label: '手机号', value: state.phone ?? widget.phone),
        if (state.nickname != null)
          _InfoItem(label: '昵称', value: state.nickname!),
        if (state.auditRemark != null)
          _InfoItem(label: '驳回原因', value: state.auditRemark!),
      ],
      actions: [
        _buildButton(
          text: '修改信息重新提交',
          onPressed: () async {
            final result =
                await context.push<bool>('/resubmit?phone=${widget.phone}');
            if (result == true && mounted) {
              ref
                  .read(accountReviewViewModelProvider.notifier)
                  .refresh(widget.phone);
            }
          },
          isPrimary: true,
        ),
        _buildButton(
          text: '返回登录',
          onPressed: _backToLogin,
          isPrimary: false,
        ),
      ],
    );
  }

  Widget _buildStatusView({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required List<_InfoItem> infoItems,
    required List<Widget> actions,
  }) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.pageHorizontal + 8,
        ),
        child: Container(
          width: double.infinity,
          padding: EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(AppRadius.xxl),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 状态图标
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 40, color: iconColor),
              ),
              SizedBox(height: AppSpacing.md),
              // 标题
              Text(
                title,
                style: AppTypography.headlineSmall.copyWith(
                  color: AppColors.darkText,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: AppSpacing.xs),
              // 副标题
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.secondaryText,
                ),
              ),
              SizedBox(height: AppSpacing.lg),
              // 信息卡片
              if (infoItems.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Column(
                    children: infoItems
                        .map((item) => _buildInfoRow(item))
                        .toList(),
                  ),
                ),
                SizedBox(height: AppSpacing.lg),
              ],
              // 操作按钮
              ...actions,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(_InfoItem item) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              item.label,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.secondaryText,
              ),
            ),
          ),
          Expanded(
            child: Text(
              item.value,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.darkText,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required String text,
    required VoidCallback onPressed,
    required bool isPrimary,
  }) {
    final marginBottom = AppSpacing.sm;
    return Padding(
      padding: EdgeInsets.only(bottom: marginBottom),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: isPrimary
            ? FilledButton(
                onPressed: onPressed,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.button),
                  ),
                ),
                child: Text(
                  text,
                  style: AppTypography.titleMedium.copyWith(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
              )
            : OutlinedButton(
                onPressed: onPressed,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(color: AppColors.outlineVariant),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.button),
                  ),
                ),
                child: Text(
                  text,
                  style: AppTypography.titleMedium.copyWith(
                    fontSize: 16,
                  ),
                ),
              ),
      ),
    );
  }
}

/// 信息项数据类
class _InfoItem {
  final String label;
  final String value;

  _InfoItem({required this.label, required this.value});
}
