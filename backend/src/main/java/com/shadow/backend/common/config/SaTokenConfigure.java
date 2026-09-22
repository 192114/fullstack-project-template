package com.shadow.backend.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.router.SaHttpMethod;
import cn.dev33.satoken.router.SaRouter;
import com.shadow.backend.common.util.StpAdminUtil;
import com.shadow.backend.common.util.StpAppUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfigure implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // ========== App 用户拦截器（StpAppUtil, accountType = "app"） ==========
        registry.addInterceptor(new SaInterceptor(handle -> StpAppUtil.checkLogin()))
                .addPathPatterns("/api/app/**")
                .excludePathPatterns(
                        "/api/app/auth/login/password",
                        "/api/app/auth/login/sms",
                        "/api/app/auth/register",
                        "/api/app/auth/refresh",
                        "/api/app/auth/send-code",
                        "/api/app/auth/reset-password",
                        "/api/app/auth/audit-status",
                        "/api/app/auth/resubmit"
                );

        // ========== Admin 用户拦截器（StpAdminUtil, accountType = "admin"） ==========
        // 单 Token + 滑动续期：每次请求自动检查剩余时间，低于阈值时续期
        // 登录校验之上叠加路由级权限校验（映射表见 docs/backend-optimization/api.md 第一节）
        registry.addInterceptor(new SaInterceptor(handle -> {
                    StpAdminUtil.checkLogin();
                    StpAdminUtil.autoRenew();
                    checkAdminRoutePermission();
                }))
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns(
                        "/api/admin/auth/login"
                );
    }

    /**
     * 管理端路由级权限校验。规则自上而下匹配，命中即校验对应权限并停止匹配；
     * 未命中任何规则的路径仅要求登录。注意 Sa-Token 通配符 `*` 可跨越 `/`，
     * 因此带子路径的路由（如 /roles/{id}/menus）必须排在单段通配规则之前。
     */
    private void checkAdminRoutePermission() {
        // ---------- 仅登录，不校验权限 ----------
        SaRouter.match("/api/admin/auth/**").stop();
        SaRouter.match("/api/admin/menus/tree").stop();

        // ---------- 菜单管理 ----------
        SaRouter.match("/api/admin/menus/all").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("menu:list")).stop();
        SaRouter.match("/api/admin/menus").match(SaHttpMethod.POST)
                .check(r -> StpAdminUtil.checkPermission("menu:create")).stop();
        SaRouter.match("/api/admin/menus/*").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("menu:update")).stop();
        SaRouter.match("/api/admin/menus/*").match(SaHttpMethod.DELETE)
                .check(r -> StpAdminUtil.checkPermission("menu:delete")).stop();

        // ---------- 角色管理 ----------
        SaRouter.match("/api/admin/roles").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("role:list")).stop();
        SaRouter.match("/api/admin/roles/all").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("role:list")).stop();
        SaRouter.match("/api/admin/roles/*").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("role:list")).stop();
        SaRouter.match("/api/admin/roles").match(SaHttpMethod.POST)
                .check(r -> StpAdminUtil.checkPermission("role:create")).stop();
        SaRouter.match("/api/admin/roles/*/menus").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("role:assign")).stop();
        SaRouter.match("/api/admin/roles/*").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("role:update")).stop();
        SaRouter.match("/api/admin/roles/*").match(SaHttpMethod.DELETE)
                .check(r -> StpAdminUtil.checkPermission("role:delete")).stop();

        // ---------- 管理员管理 ----------
        SaRouter.match("/api/admin/admin-users").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("admin-user:list")).stop();
        SaRouter.match("/api/admin/admin-users/*").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("admin-user:list")).stop();
        SaRouter.match("/api/admin/admin-users").match(SaHttpMethod.POST)
                .check(r -> StpAdminUtil.checkPermission("admin-user:create")).stop();
        SaRouter.match("/api/admin/admin-users/*/roles").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("admin-user:assign")).stop();
        SaRouter.match("/api/admin/admin-users/*").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("admin-user:update")).stop();
        SaRouter.match("/api/admin/admin-users/*").match(SaHttpMethod.DELETE)
                .check(r -> StpAdminUtil.checkPermission("admin-user:delete")).stop();

        // ---------- App 用户管理（CUD 暂归 user:list，见 api.md 决策 D4） ----------
        SaRouter.match("/api/admin/users").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("user:list")).stop();
        SaRouter.match("/api/admin/users/*").match(SaHttpMethod.GET)
                .check(r -> StpAdminUtil.checkPermission("user:list")).stop();
        SaRouter.match("/api/admin/users").match(SaHttpMethod.POST)
                .check(r -> StpAdminUtil.checkPermission("user:list")).stop();
        SaRouter.match("/api/admin/users/*/audit").match(SaHttpMethod.POST)
                .check(r -> StpAdminUtil.checkPermission("user:audit")).stop();
        SaRouter.match("/api/admin/users/*").match(SaHttpMethod.PUT)
                .check(r -> StpAdminUtil.checkPermission("user:list")).stop();
        SaRouter.match("/api/admin/users/*").match(SaHttpMethod.DELETE)
                .check(r -> StpAdminUtil.checkPermission("user:list")).stop();
    }
}
