package com.shadow.backend.common.util;

public final class LoginUserUtil {

    private LoginUserUtil() {
    }

    public static Long currentUserId() {
        return StpAppUtil.getLoginIdAsLong();
    }

    public static boolean isLogin() {
        return StpAppUtil.isLogin();
    }
}
