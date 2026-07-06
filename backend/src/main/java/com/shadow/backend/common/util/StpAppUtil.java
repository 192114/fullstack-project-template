package com.shadow.backend.common.util;

import cn.dev33.satoken.session.SaSession;
import cn.dev33.satoken.stp.StpLogic;

/**
 * App 用户认证工具类（accountType = "app"）
 * <p>
 * 与 {@link StpAdminUtil} 完全隔离，Redis key 前缀、token 体系互不干扰。
 */
public class StpAppUtil {

    public static StpLogic stpLogic = new StpLogic("app");

    public static void login(Object id) {
        stpLogic.login(id);
    }

    public static void logout() {
        stpLogic.logout();
    }

    public static void checkLogin() {
        stpLogic.checkLogin();
    }

    public static boolean isLogin() {
        return stpLogic.isLogin();
    }

    public static Object getLoginId() {
        return stpLogic.getLoginId();
    }

    public static long getLoginIdAsLong() {
        return stpLogic.getLoginIdAsLong();
    }

    public static String getTokenValue() {
        return stpLogic.getTokenValue();
    }

    public static long getTokenTimeout() {
        return stpLogic.getTokenTimeout();
    }

    public static void renewTimeout(long timeout) {
        stpLogic.renewTimeout(timeout);
    }

    public static SaSession getSession() {
        return stpLogic.getSession();
    }
}
