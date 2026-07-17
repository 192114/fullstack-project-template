-- ============================================================
-- 菜单结构迁移脚本
-- 旧结构: 首页 / 用户管理(App用户管理, 管理员管理) / 角色管理 / 菜单管理
-- 新结构: 首页 / 系统管理(管理员管理, 角色管理, 菜单管理) / APP管理(用户管理)
-- ============================================================

USE backend;

-- 1. 清除现有角色菜单关联和菜单数据
DELETE FROM sys_role_menu;
DELETE FROM sys_menu;

-- 2. 重置自增ID
ALTER TABLE sys_menu AUTO_INCREMENT = 1;

-- 3. 插入新菜单结构

-- ===== 顶级菜单 =====

-- 首页 (菜单)
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (1, 0, '首页', 2, '/', 'LayoutDashboard', 1, 'dashboard:view', 1, 1);

-- 系统管理 (目录)
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (2, 0, '系统管理', 1, NULL, 'Settings', 2, NULL, 1, 1);

-- APP管理 (目录) - 与系统管理平级
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (3, 0, 'APP管理', 1, NULL, 'Smartphone', 3, NULL, 1, 1);

-- ===== 系统管理 > 管理员管理 (菜单) =====

INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (4, 2, '管理员管理', 2, '/admin-users', 'UserCog', 1, 'admin-user:list', 1, 1);

-- 管理员管理按钮
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (5, 4, '新增管理员', 3, NULL, NULL, 1, 'admin-user:create', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (6, 4, '修改管理员', 3, NULL, NULL, 2, 'admin-user:update', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (7, 4, '删除管理员', 3, NULL, NULL, 3, 'admin-user:delete', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (8, 4, '分配角色', 3, NULL, NULL, 4, 'admin-user:assign', 1, 1);

-- ===== 系统管理 > 角色管理 (菜单) =====

INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (9, 2, '角色管理', 2, '/roles', 'Shield', 2, 'role:list', 1, 1);

-- 角色管理按钮
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (10, 9, '新增角色', 3, NULL, NULL, 1, 'role:create', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (11, 9, '修改角色', 3, NULL, NULL, 2, 'role:update', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (12, 9, '删除角色', 3, NULL, NULL, 3, 'role:delete', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (13, 9, '分配权限', 3, NULL, NULL, 4, 'role:assign', 1, 1);

-- ===== 系统管理 > 菜单管理 (菜单) =====

INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (14, 2, '菜单管理', 2, '/menus', 'Menu', 3, 'menu:list', 1, 1);

-- 菜单管理按钮
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (15, 14, '新增菜单', 3, NULL, NULL, 1, 'menu:create', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (16, 14, '修改菜单', 3, NULL, NULL, 2, 'menu:update', 1, 1);
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (17, 14, '删除菜单', 3, NULL, NULL, 3, 'menu:delete', 1, 1);

-- ===== APP管理 > App 用户管理 (菜单) =====

INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (18, 3, 'App 用户管理', 2, '/app-users', 'Users', 1, 'user:list', 1, 1);

-- App 用户管理按钮
INSERT INTO sys_menu (id, parent_id, name, type, path, icon, sort_order, permission, visible, status)
VALUES (19, 18, '审核用户', 3, NULL, NULL, 1, 'user:audit', 1, 1);

-- 4. 关联超级管理员角色(code=support)与全部菜单
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
CROSS JOIN sys_menu m
WHERE r.code = 'support' AND r.deleted = 0;

-- 5. 重置自增ID为安全值，避免后续插入冲突
ALTER TABLE sys_menu AUTO_INCREMENT = 100;
