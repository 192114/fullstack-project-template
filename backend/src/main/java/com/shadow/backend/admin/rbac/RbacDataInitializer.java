package com.shadow.backend.admin.rbac;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shadow.backend.admin.adminuser.entity.SysUserRole;
import com.shadow.backend.admin.adminuser.mapper.SysUserRoleMapper;
import com.shadow.backend.admin.auth.entity.AdminUser;
import com.shadow.backend.admin.auth.mapper.AdminUserMapper;
import com.shadow.backend.admin.menu.entity.SysMenu;
import com.shadow.backend.admin.menu.mapper.SysMenuMapper;
import com.shadow.backend.admin.role.entity.SysRole;
import com.shadow.backend.admin.role.entity.SysRoleMenu;
import com.shadow.backend.admin.role.mapper.SysRoleMapper;
import com.shadow.backend.admin.role.mapper.SysRoleMenuMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * RBAC 种子数据初始化器
 * <p>
 * 首次启动时自动创建：
 * 1. 默认菜单树（首页、系统管理(管理员管理, 角色管理, 菜单管理) + APP管理(用户管理) + 按钮权限）
 * 2. "超级管理员"角色（code=support），关联全部菜单
 * 3. 将 admin 用户关联到超级管理员角色
 * <p>
 * 运行优先级低于 AdminUserInitializer（确保 admin 用户已存在）。
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class RbacDataInitializer implements CommandLineRunner {

    private final SysMenuMapper sysMenuMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysRoleMenuMapper sysRoleMenuMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final AdminUserMapper adminUserMapper;

    @Override
    public void run(String... args) {
        initMenus();
        initSuperAdminRole();
        assignAdminToSuperAdmin();
    }

    private void initMenus() {
        long count = sysMenuMapper.selectCount(null);
        if (count > 0) {
            return;
        }

        List<SysMenu> menus = new ArrayList<>();

        // 首页
        menus.add(createMenu(0L, "首页", 2, "/", "LayoutDashboard", 1, "dashboard:view"));

        // 系统管理(目录) - 顶级
        SysMenu systemDir = createMenu(0L, "系统管理", 1, null, "Settings", 2, null);
        menus.add(systemDir);

        // APP管理(目录) - 顶级, 与系统管理平级
        SysMenu appDir = createMenu(0L, "APP管理", 1, null, "Smartphone", 3, null);
        menus.add(appDir);

        // 管理员管理(菜单) - 系统管理子菜单
        SysMenu adminUserMenu = createMenu(0L, "管理员管理", 2, "/admin-users", "UserCog", 1, "admin-user:list");
        menus.add(adminUserMenu);

        // 管理员管理按钮
        menus.add(createMenu(0L, "新增管理员", 3, null, null, 1, "admin-user:create"));
        menus.add(createMenu(0L, "修改管理员", 3, null, null, 2, "admin-user:update"));
        menus.add(createMenu(0L, "删除管理员", 3, null, null, 3, "admin-user:delete"));
        menus.add(createMenu(0L, "分配角色", 3, null, null, 4, "admin-user:assign"));

        // 角色管理(菜单) - 系统管理子菜单
        SysMenu roleMenu = createMenu(0L, "角色管理", 2, "/roles", "Shield", 2, "role:list");
        menus.add(roleMenu);

        // 角色管理按钮
        menus.add(createMenu(0L, "新增角色", 3, null, null, 1, "role:create"));
        menus.add(createMenu(0L, "修改角色", 3, null, null, 2, "role:update"));
        menus.add(createMenu(0L, "删除角色", 3, null, null, 3, "role:delete"));
        menus.add(createMenu(0L, "分配权限", 3, null, null, 4, "role:assign"));

        // 菜单管理(菜单) - 系统管理子菜单
        SysMenu menuMenu = createMenu(0L, "菜单管理", 2, "/menus", "Menu", 3, "menu:list");
        menus.add(menuMenu);

        // 菜单管理按钮
        menus.add(createMenu(0L, "新增菜单", 3, null, null, 1, "menu:create"));
        menus.add(createMenu(0L, "修改菜单", 3, null, null, 2, "menu:update"));
        menus.add(createMenu(0L, "删除菜单", 3, null, null, 3, "menu:delete"));

        // 用户管理(菜单) - APP管理子菜单, 原 App用户管理
        menus.add(createMenu(0L, "用户管理", 2, "/users", "Users", 1, "user:list"));

        // 先插入所有菜单获取ID
        for (SysMenu menu : menus) {
            sysMenuMapper.insert(menu);
        }

        // 设置 parentId 关系
        // 找到各个父菜单
        SysMenu systemDirSaved = findByName(menus, "系统管理");
        SysMenu appDirSaved = findByName(menus, "APP管理");
        SysMenu adminUserMenuSaved = findByName(menus, "管理员管理");
        SysMenu roleMenuSaved = findByName(menus, "角色管理");
        SysMenu menuMenuSaved = findByName(menus, "菜单管理");

        // 设置子菜单的 parentId
        for (SysMenu menu : menus) {
            // 管理员管理、角色管理、菜单管理 -> 系统管理
            if ("管理员管理".equals(menu.getName()) || "角色管理".equals(menu.getName())
                    || "菜单管理".equals(menu.getName())) {
                menu.setParentId(systemDirSaved.getId());
                sysMenuMapper.updateById(menu);
            }
            // 用户管理 -> APP管理
            if ("用户管理".equals(menu.getName())) {
                menu.setParentId(appDirSaved.getId());
                sysMenuMapper.updateById(menu);
            }
            // 管理员管理按钮 -> 管理员管理
            if ("新增管理员".equals(menu.getName()) || "修改管理员".equals(menu.getName())
                    || "删除管理员".equals(menu.getName()) || "分配角色".equals(menu.getName())) {
                menu.setParentId(adminUserMenuSaved.getId());
                sysMenuMapper.updateById(menu);
            }
            // 角色管理按钮 -> 角色管理
            if ("新增角色".equals(menu.getName()) || "修改角色".equals(menu.getName())
                    || "删除角色".equals(menu.getName()) || "分配权限".equals(menu.getName())) {
                menu.setParentId(roleMenuSaved.getId());
                sysMenuMapper.updateById(menu);
            }
            // 菜单管理按钮 -> 菜单管理
            if ("新增菜单".equals(menu.getName()) || "修改菜单".equals(menu.getName())
                    || "删除菜单".equals(menu.getName())) {
                menu.setParentId(menuMenuSaved.getId());
                sysMenuMapper.updateById(menu);
            }
        }

        log.info("RBAC: 已初始化 {} 条菜单数据", menus.size());
    }

    private void initSuperAdminRole() {
        long count = sysRoleMapper.selectCount(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getCode, "support")
        );
        if (count > 0) {
            return;
        }

        // 创建角色
        SysRole role = new SysRole();
        role.setName("超级管理员");
        role.setCode("support");
        role.setSortOrder(1);
        role.setStatus(1);
        role.setRemark("拥有全部权限");
        sysRoleMapper.insert(role);

        // 关联全部菜单
        List<SysMenu> allMenus = sysMenuMapper.selectList(null);
        for (SysMenu menu : allMenus) {
            SysRoleMenu rm = new SysRoleMenu();
            rm.setRoleId(role.getId());
            rm.setMenuId(menu.getId());
            sysRoleMenuMapper.insert(rm);
        }

        log.info("RBAC: 已创建超级管理员角色并关联 {} 个菜单", allMenus.size());
    }

    private void assignAdminToSuperAdmin() {
        // 查找 admin 用户
        AdminUser admin = adminUserMapper.selectOne(
                new LambdaQueryWrapper<AdminUser>().eq(AdminUser::getUsername, "admin")
        );
        if (admin == null) {
            log.warn("RBAC: admin 用户不存在，跳过角色分配");
            return;
        }

        // 查找超级管理员角色
        SysRole role = sysRoleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getCode, "support")
        );
        if (role == null) {
            log.warn("RBAC: 超级管理员角色不存在，跳过");
            return;
        }

        // 检查是否已关联
        long count = sysUserRoleMapper.selectCount(
                new LambdaQueryWrapper<SysUserRole>()
                        .eq(SysUserRole::getUserId, admin.getId())
                        .eq(SysUserRole::getRoleId, role.getId())
        );
        if (count > 0) {
            return;
        }

        SysUserRole ur = new SysUserRole();
        ur.setUserId(admin.getId());
        ur.setRoleId(role.getId());
        sysUserRoleMapper.insert(ur);

        log.info("RBAC: 已将 admin 用户关联到超级管理员角色");
    }

    private SysMenu createMenu(Long parentId, String name, int type, String path,
                               String icon, int sortOrder, String permission) {
        SysMenu menu = new SysMenu();
        menu.setParentId(parentId);
        menu.setName(name);
        menu.setType(type);
        menu.setPath(path);
        menu.setIcon(icon);
        menu.setSortOrder(sortOrder);
        menu.setPermission(permission);
        menu.setVisible(1);
        menu.setStatus(1);
        return menu;
    }

    private SysMenu findByName(List<SysMenu> menus, String name) {
        return menus.stream()
                .filter(m -> name.equals(m.getName()))
                .findFirst()
                .orElse(null);
    }
}
