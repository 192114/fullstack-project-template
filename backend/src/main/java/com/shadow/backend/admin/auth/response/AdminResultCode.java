package com.shadow.backend.admin.auth.response;

import com.shadow.backend.common.response.IResultCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AdminResultCode implements IResultCode {

    LOGIN_FAILED(20001, "用户名或密码错误"),
    ADMIN_DISABLED(20002, "账号已被禁用"),
    ADMIN_NOT_FOUND(20003, "管理员账号不存在"),

    // Menu
    MENU_NOT_FOUND(20101, "菜单不存在"),
    MENU_HAS_CHILDREN(20102, "存在子菜单，无法删除"),

    // Role
    ROLE_NOT_FOUND(20201, "角色不存在"),
    ROLE_CODE_EXISTS(20202, "角色编码已存在"),
    ROLE_IN_USE(20203, "角色已分配给用户，无法删除"),

    // Admin User
    ADMIN_USERNAME_EXISTS(20301, "用户名已存在"),
    CANNOT_DELETE_SELF(20302, "不能删除当前登录账号"),
    CANNOT_DISABLE_SELF(20303, "不能禁用当前登录账号");

    private final int code;
    private final String msg;
}
