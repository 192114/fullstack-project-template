package com.shadow.backend.admin.adminuser.service.impl;

import com.shadow.backend.admin.adminuser.dto.AssignRolesRequest;
import com.shadow.backend.admin.adminuser.dto.UpdateAdminUserRequest;
import com.shadow.backend.admin.adminuser.entity.SysUserRole;
import com.shadow.backend.admin.adminuser.mapper.SysUserRoleMapper;
import com.shadow.backend.admin.auth.entity.AdminUser;
import com.shadow.backend.admin.auth.mapper.AdminUserMapper;
import com.shadow.backend.admin.auth.response.AdminResultCode;
import com.shadow.backend.admin.role.mapper.SysRoleMapper;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.LoginAdminUtil;
import com.shadow.backend.common.util.PasswordUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserManageServiceImplTest {

    @Mock
    private AdminUserMapper adminUserMapper;
    @Mock
    private SysUserRoleMapper sysUserRoleMapper;
    @Mock
    private SysRoleMapper sysRoleMapper;
    @Mock
    private PasswordUtil passwordUtil;

    @InjectMocks
    private AdminUserManageServiceImpl adminUserManageService;

    private AdminUser targetUser;

    @BeforeEach
    void setUp() {
        targetUser = new AdminUser();
        targetUser.setId(2L);
        targetUser.setUsername("editor");
        targetUser.setStatus(1);
    }

    // ---------- update: 不能禁用自己 ----------

    @Test
    void update_whenDisablingSelf_throws() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);
        UpdateAdminUserRequest req = new UpdateAdminUserRequest();
        req.setStatus(0);

        try (MockedStatic<LoginAdminUtil> loginAdminUtil = Mockito.mockStatic(LoginAdminUtil.class)) {
            loginAdminUtil.when(LoginAdminUtil::currentAdminId).thenReturn(2L);

            assertThatThrownBy(() -> adminUserManageService.update(2L, req))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getCode())
                    .isEqualTo(AdminResultCode.CANNOT_DISABLE_SELF.getCode());
        }

        verify(adminUserMapper, never()).updateById(any(AdminUser.class));
    }

    @Test
    void update_whenDisablingSomeoneElse_succeeds() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);
        UpdateAdminUserRequest req = new UpdateAdminUserRequest();
        req.setStatus(0);

        try (MockedStatic<LoginAdminUtil> loginAdminUtil = Mockito.mockStatic(LoginAdminUtil.class)) {
            loginAdminUtil.when(LoginAdminUtil::currentAdminId).thenReturn(1L);

            adminUserManageService.update(2L, req);
        }

        verify(adminUserMapper).updateById(targetUser);
    }

    @Test
    void update_whenUserNotFound_throws() {
        when(adminUserMapper.selectById(99L)).thenReturn(null);

        assertThatThrownBy(() -> adminUserManageService.update(99L, new UpdateAdminUserRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AdminResultCode.ADMIN_NOT_FOUND.getCode());
    }

    // ---------- delete: 不能删除自己 ----------

    @Test
    void delete_whenDeletingSelf_throws() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);

        try (MockedStatic<LoginAdminUtil> loginAdminUtil = Mockito.mockStatic(LoginAdminUtil.class)) {
            loginAdminUtil.when(LoginAdminUtil::currentAdminId).thenReturn(2L);

            assertThatThrownBy(() -> adminUserManageService.delete(2L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getCode())
                    .isEqualTo(AdminResultCode.CANNOT_DELETE_SELF.getCode());
        }

        verify(adminUserMapper, never()).deleteById(any(Long.class));
        verify(sysUserRoleMapper, never()).delete(any());
    }

    @Test
    void delete_whenDeletingSomeoneElse_removesRoleLinksThenUser() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);

        try (MockedStatic<LoginAdminUtil> loginAdminUtil = Mockito.mockStatic(LoginAdminUtil.class)) {
            loginAdminUtil.when(LoginAdminUtil::currentAdminId).thenReturn(1L);

            adminUserManageService.delete(2L);
        }

        verify(sysUserRoleMapper).delete(any());
        verify(adminUserMapper).deleteById(2L);
    }

    // ---------- assignRoles ----------

    @Test
    void assignRoles_whenUserNotFound_throws() {
        when(adminUserMapper.selectById(2L)).thenReturn(null);
        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleIds(List.of(1L));

        assertThatThrownBy(() -> adminUserManageService.assignRoles(2L, req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AdminResultCode.ADMIN_NOT_FOUND.getCode());
    }

    @Test
    void assignRoles_replacesOldLinksWithNewOnes() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);
        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleIds(List.of(10L, 20L));

        adminUserManageService.assignRoles(2L, req);

        verify(sysUserRoleMapper).delete(any());
        verify(sysUserRoleMapper, times(2)).insert(any(SysUserRole.class));
    }

    @Test
    void assignRoles_whenEmptyRoleIds_onlyDeletesOldLinks() {
        when(adminUserMapper.selectById(2L)).thenReturn(targetUser);
        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleIds(List.of());

        adminUserManageService.assignRoles(2L, req);

        verify(sysUserRoleMapper).delete(any());
        verify(sysUserRoleMapper, never()).insert(any(SysUserRole.class));
    }
}
