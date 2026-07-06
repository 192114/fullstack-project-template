package com.shadow.backend.common.util;

/**
 * Admin 登录用户工具类
 * <p>
 * 对应 {@link StpAdminUtil}（accountType = "admin"），与 {@link LoginUserUtil}（App 用户）隔离。
 */
public final class LoginAdminUtil {

    private LoginAdminUtil() {
    }

    public static Long currentAdminId() {
        return StpAdminUtil.getLoginIdAsLong();
    }

    public static boolean isAdminLogin() {
        return StpAdminUtil.isLogin();
    }
}
