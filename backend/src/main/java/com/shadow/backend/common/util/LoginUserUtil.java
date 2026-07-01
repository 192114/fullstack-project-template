package com.shadow.backend.common.util;

import cn.dev33.satoken.stp.StpUtil;

public final class LoginUserUtil {

    private LoginUserUtil() {
    }

    public static Long currentUserId() {
        return StpUtil.getLoginIdAsLong();
    }

    public static boolean isLogin() {
        return StpUtil.isLogin();
    }
}
