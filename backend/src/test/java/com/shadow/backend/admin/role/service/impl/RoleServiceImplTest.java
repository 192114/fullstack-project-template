package com.shadow.backend.admin.role.service.impl;

import com.shadow.backend.admin.auth.response.AdminResultCode;
import com.shadow.backend.admin.role.dto.AssignMenusRequest;
import com.shadow.backend.admin.role.entity.SysRole;
import com.shadow.backend.admin.role.entity.SysRoleMenu;
import com.shadow.backend.admin.role.mapper.SysRoleMapper;
import com.shadow.backend.admin.role.mapper.SysRoleMenuMapper;
import com.shadow.backend.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private SysRoleMapper sysRoleMapper;
    @Mock
    private SysRoleMenuMapper sysRoleMenuMapper;

    @InjectMocks
    private RoleServiceImpl roleService;

    private SysRole role;

    @BeforeEach
    void setUp() {
        role = new SysRole();
        role.setId(5L);
        role.setName("editor");
    }

    // ---------- delete: 角色被占用时禁止删除 ----------

    @Test
    void delete_whenRoleNotFound_throws() {
        when(sysRoleMapper.selectById(5L)).thenReturn(null);

        assertThatThrownBy(() -> roleService.delete(5L))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AdminResultCode.ROLE_NOT_FOUND.getCode());
    }

    @Test
    void delete_whenRoleInUse_throwsWithoutDeleting() {
        when(sysRoleMapper.selectById(5L)).thenReturn(role);
        when(sysRoleMapper.countUsersByRoleId(5L)).thenReturn(2L);

        assertThatThrownBy(() -> roleService.delete(5L))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AdminResultCode.ROLE_IN_USE.getCode());

        verify(sysRoleMenuMapper, never()).delete(any());
        verify(sysRoleMapper, never()).deleteById(any(Long.class));
    }

    @Test
    void delete_whenRoleNotInUse_removesMenuLinksThenRole() {
        when(sysRoleMapper.selectById(5L)).thenReturn(role);
        when(sysRoleMapper.countUsersByRoleId(5L)).thenReturn(0L);

        roleService.delete(5L);

        verify(sysRoleMenuMapper).delete(any());
        verify(sysRoleMapper).deleteById(5L);
    }

    // ---------- assignMenus ----------

    @Test
    void assignMenus_whenRoleNotFound_throws() {
        when(sysRoleMapper.selectById(5L)).thenReturn(null);
        AssignMenusRequest req = new AssignMenusRequest();
        req.setMenuIds(List.of(1L));

        assertThatThrownBy(() -> roleService.assignMenus(5L, req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AdminResultCode.ROLE_NOT_FOUND.getCode());
    }

    @Test
    void assignMenus_replacesOldLinksWithNewOnes() {
        when(sysRoleMapper.selectById(5L)).thenReturn(role);
        AssignMenusRequest req = new AssignMenusRequest();
        req.setMenuIds(List.of(100L, 200L, 300L));

        roleService.assignMenus(5L, req);

        verify(sysRoleMenuMapper).delete(any());
        verify(sysRoleMenuMapper, times(3)).insert(any(SysRoleMenu.class));
    }

    @Test
    void assignMenus_whenEmptyMenuIds_onlyDeletesOldLinks() {
        when(sysRoleMapper.selectById(5L)).thenReturn(role);
        AssignMenusRequest req = new AssignMenusRequest();
        req.setMenuIds(List.of());

        roleService.assignMenus(5L, req);

        verify(sysRoleMenuMapper).delete(any());
        verify(sysRoleMenuMapper, never()).insert(any(SysRoleMenu.class));
    }
}
