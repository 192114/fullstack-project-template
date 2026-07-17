package com.shadow.backend.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
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
        registry.addInterceptor(new SaInterceptor(handle -> {
                    StpAdminUtil.checkLogin();
                    StpAdminUtil.autoRenew();
                }))
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns(
                        "/api/admin/auth/login"
                );
    }
}
