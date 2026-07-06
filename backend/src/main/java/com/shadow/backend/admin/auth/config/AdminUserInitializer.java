package com.shadow.backend.admin.auth.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shadow.backend.admin.auth.entity.AdminUser;
import com.shadow.backend.admin.auth.mapper.AdminUserMapper;
import com.shadow.backend.common.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Admin 种子用户初始化器
 * <p>
 * 首次启动时自动创建默认管理员账号（如不存在）：
 * 用户名: admin / 密码: admin123
 * <p>
 * 生产环境请部署后立即修改密码！
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final AdminUserMapper adminUserMapper;
    private final PasswordUtil passwordUtil;

    @Override
    public void run(String... args) {
        long count = adminUserMapper.selectCount(
                new LambdaQueryWrapper<AdminUser>().eq(AdminUser::getUsername, "admin")
        );
        if (count == 0) {
            AdminUser admin = new AdminUser();
            admin.setUsername("admin");
            admin.setPassword(passwordUtil.hash("admin123"));
            admin.setNickname("超级管理员");
            admin.setEmail("admin@shadow.com");
            admin.setStatus(1);
            adminUserMapper.insert(admin);
            log.warn("已创建默认管理员账号: admin / admin123（请尽快修改密码！）");
        }
    }
}
