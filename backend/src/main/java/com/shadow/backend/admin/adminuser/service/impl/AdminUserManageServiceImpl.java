package com.shadow.backend.admin.adminuser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shadow.backend.admin.adminuser.dto.AssignRolesRequest;
import com.shadow.backend.admin.adminuser.dto.CreateAdminUserRequest;
import com.shadow.backend.admin.adminuser.dto.UpdateAdminUserRequest;
import com.shadow.backend.admin.adminuser.entity.SysUserRole;
import com.shadow.backend.admin.adminuser.mapper.SysUserRoleMapper;
import com.shadow.backend.admin.adminuser.service.AdminUserManageService;
import com.shadow.backend.admin.adminuser.vo.AdminUserManageVO;
import com.shadow.backend.admin.auth.entity.AdminUser;
import com.shadow.backend.admin.auth.mapper.AdminUserMapper;
import com.shadow.backend.admin.auth.response.AdminResultCode;
import com.shadow.backend.admin.role.entity.SysRole;
import com.shadow.backend.admin.role.mapper.SysRoleMapper;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.response.PageResult;
import com.shadow.backend.common.util.LoginAdminUtil;
import com.shadow.backend.common.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserManageServiceImpl implements AdminUserManageService {

    private final AdminUserMapper adminUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final PasswordUtil passwordUtil;

    @Override
    public PageResult<AdminUserManageVO> page(long current, long size, String username) {
        LambdaQueryWrapper<AdminUser> wrapper = new LambdaQueryWrapper<>();
        if (username != null && !username.isBlank()) {
            wrapper.like(AdminUser::getUsername, username);
        }
        wrapper.orderByDesc(AdminUser::getCreateTime);

        Page<AdminUser> page = new Page<>(current, size);
        Page<AdminUser> result = adminUserMapper.selectPage(page, wrapper);

        List<AdminUserManageVO> records = result.getRecords().stream()
                .map(this::toVOWithoutRoles)
                .collect(Collectors.toList());

        // 批量加载角色
        if (!records.isEmpty()) {
            List<Long> userIds = records.stream().map(AdminUserManageVO::getId).collect(Collectors.toList());
            Map<Long, List<AdminUserManageVO.SimpleRole>> roleMap = batchLoadRoles(userIds);
            for (AdminUserManageVO vo : records) {
                vo.setRoles(roleMap.getOrDefault(vo.getId(), Collections.emptyList()));
            }
        }

        return PageResult.of(current, size, result.getTotal(), records);
    }

    @Override
    public AdminUserManageVO getById(Long id) {
        AdminUser user = adminUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(AdminResultCode.ADMIN_NOT_FOUND);
        }
        AdminUserManageVO vo = toVOWithoutRoles(user);
        vo.setRoles(loadRoles(id));
        return vo;
    }

    @Override
    @Transactional
    public AdminUserManageVO create(CreateAdminUserRequest request) {
        // 检查用户名唯一
        long count = adminUserMapper.selectCount(
                new LambdaQueryWrapper<AdminUser>().eq(AdminUser::getUsername, request.getUsername())
        );
        if (count > 0) {
            throw new BusinessException(AdminResultCode.ADMIN_USERNAME_EXISTS);
        }

        AdminUser user = new AdminUser();
        user.setUsername(request.getUsername());
        user.setPassword(passwordUtil.hash(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setStatus(request.getStatus());
        adminUserMapper.insert(user);

        return toVOWithoutRoles(user);
    }

    @Override
    @Transactional
    public AdminUserManageVO update(Long id, UpdateAdminUserRequest request) {
        AdminUser user = adminUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(AdminResultCode.ADMIN_NOT_FOUND);
        }

        // 不能禁用自己
        Long currentId = LoginAdminUtil.currentAdminId();
        if (id.equals(currentId) && request.getStatus() != null && request.getStatus() == 0) {
            throw new BusinessException(AdminResultCode.CANNOT_DISABLE_SELF);
        }

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        adminUserMapper.updateById(user);

        return toVOWithoutRoles(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        AdminUser user = adminUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(AdminResultCode.ADMIN_NOT_FOUND);
        }

        // 不能删除自己
        Long currentId = LoginAdminUtil.currentAdminId();
        if (id.equals(currentId)) {
            throw new BusinessException(AdminResultCode.CANNOT_DELETE_SELF);
        }

        // 删除用户-角色关联
        sysUserRoleMapper.delete(
                new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, id)
        );
        adminUserMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void assignRoles(Long id, AssignRolesRequest request) {
        AdminUser user = adminUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(AdminResultCode.ADMIN_NOT_FOUND);
        }

        // 先删除旧关联
        sysUserRoleMapper.delete(
                new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, id)
        );

        // 插入新关联
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            for (Long roleId : request.getRoleIds()) {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(id);
                ur.setRoleId(roleId);
                sysUserRoleMapper.insert(ur);
            }
        }
    }

    // ==================== Private Helpers ====================

    private List<AdminUserManageVO.SimpleRole> loadRoles(Long userId) {
        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(
                new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, userId)
        );
        if (userRoles.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> roleIds = userRoles.stream().map(SysUserRole::getRoleId).collect(Collectors.toList());
        List<SysRole> roles = sysRoleMapper.selectBatchIds(roleIds);
        return roles.stream().map(this::toSimpleRole).collect(Collectors.toList());
    }

    private Map<Long, List<AdminUserManageVO.SimpleRole>> batchLoadRoles(List<Long> userIds) {
        // 查询所有用户-角色关联
        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(
                new LambdaQueryWrapper<SysUserRole>().in(SysUserRole::getUserId, userIds)
        );
        if (userRoles.isEmpty()) {
            return Collections.emptyMap();
        }

        // 查询角色详情
        Set<Long> roleIds = userRoles.stream().map(SysUserRole::getRoleId).collect(Collectors.toSet());
        List<SysRole> roles = sysRoleMapper.selectBatchIds(roleIds);
        Map<Long, SysRole> roleMap = roles.stream()
                .collect(Collectors.toMap(SysRole::getId, r -> r));

        // 按用户分组
        Map<Long, List<AdminUserManageVO.SimpleRole>> result = new java.util.HashMap<>();
        for (SysUserRole ur : userRoles) {
            SysRole role = roleMap.get(ur.getRoleId());
            if (role != null) {
                result.computeIfAbsent(ur.getUserId(), k -> new ArrayList<>())
                        .add(toSimpleRole(role));
            }
        }
        return result;
    }

    private AdminUserManageVO.SimpleRole toSimpleRole(SysRole role) {
        AdminUserManageVO.SimpleRole sr = new AdminUserManageVO.SimpleRole();
        sr.setId(role.getId());
        sr.setName(role.getName());
        sr.setCode(role.getCode());
        return sr;
    }

    private AdminUserManageVO toVOWithoutRoles(AdminUser user) {
        AdminUserManageVO vo = new AdminUserManageVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setEmail(user.getEmail());
        vo.setStatus(user.getStatus());
        vo.setCreateTime(user.getCreateTime());
        vo.setUpdateTime(user.getUpdateTime());
        return vo;
    }
}
