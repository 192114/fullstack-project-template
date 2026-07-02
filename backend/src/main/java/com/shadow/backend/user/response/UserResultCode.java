package com.shadow.backend.user.response;

import com.shadow.backend.common.response.IResultCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum UserResultCode implements IResultCode {

    USERNAME_EXIST(10001, "用户名已存在"),
    USER_NOT_FOUND(10002, "用户不存在"),
    USER_DISABLED(10003, "账号已被禁用"),
    LOGIN_FAILED(10004, "手机号或密码错误"),
    OLD_PASSWORD_INCORRECT(10005, "原密码不正确");

    private final int code;
    private final String msg;
}
