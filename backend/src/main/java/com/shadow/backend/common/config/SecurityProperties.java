package com.shadow.backend.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    /**
     * 是否信任反向代理转发头（X-Forwarded-For / X-Real-IP）获取客户端真实 IP，仅在部署于可信代理之后开启。
     */
    private boolean trustedProxy = false;

    /**
     * 初始管理员口令。dev 默认 admin123；prod 由环境变量 ADMIN_INITIAL_PASSWORD 注入，缺失时启动校验拦截。
     */
    private String initialAdminPassword = "admin123";
}
