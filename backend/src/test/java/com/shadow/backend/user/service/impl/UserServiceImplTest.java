package com.shadow.backend.user.service.impl;

import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.PasswordUtil;
import com.shadow.backend.user.dto.ChangePasswordRequest;
import com.shadow.backend.user.entity.User;
import com.shadow.backend.user.mapper.UserMapper;
import com.shadow.backend.user.response.UserResultCode;
import com.shadow.backend.user.vo.UserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordUtil passwordUtil;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setPassword("hashed-old");
        user.setAuditStatus(0);
    }

    // ---------- changePassword ----------

    @Test
    void changePassword_whenUserNotFound_throws() {
        when(userMapper.selectById(1L)).thenReturn(null);
        ChangePasswordRequest req = changePasswordRequest();

        assertThatThrownBy(() -> userService.changePassword(1L, req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.USER_NOT_FOUND.getCode());
    }

    @Test
    void changePassword_whenOldPasswordIncorrect_throws() {
        when(userMapper.selectById(1L)).thenReturn(user);
        ChangePasswordRequest req = changePasswordRequest();
        when(passwordUtil.verify(req.getOldPassword(), user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(1L, req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.OLD_PASSWORD_INCORRECT.getCode());

        verify(userMapper, never()).updateById(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void changePassword_whenSuccess_updatesHashedPassword() {
        when(userMapper.selectById(1L)).thenReturn(user);
        ChangePasswordRequest req = changePasswordRequest();
        when(passwordUtil.verify(req.getOldPassword(), user.getPassword())).thenReturn(true);
        when(passwordUtil.hash(req.getNewPassword())).thenReturn("hashed-new");

        userService.changePassword(1L, req);

        assertThat(user.getPassword()).isEqualTo("hashed-new");
        verify(userMapper).updateById(user);
    }

    // ---------- audit ----------

    @Test
    void audit_whenUserNotFound_throws() {
        when(userMapper.selectById(1L)).thenReturn(null);

        assertThatThrownBy(() -> userService.audit(1L, 1, null))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.USER_NOT_FOUND.getCode());
    }

    @Test
    void audit_whenAlreadyAudited_throws() {
        user.setAuditStatus(1);
        when(userMapper.selectById(1L)).thenReturn(user);

        assertThatThrownBy(() -> userService.audit(1L, 2, "驳回"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.USER_ALREADY_AUDITED.getCode());

        verify(userMapper, never()).updateById(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void audit_whenPending_approvesAndClearsRemark() {
        user.setAuditStatus(0);
        when(userMapper.selectById(1L)).thenReturn(user);

        UserVO vo = userService.audit(1L, 1, null);

        assertThat(user.getAuditStatus()).isEqualTo(1);
        assertThat(user.getAuditTime()).isNotNull();
        assertThat(vo.getAuditStatus()).isEqualTo(1);
        verify(userMapper).updateById(user);
    }

    @Test
    void audit_whenPending_rejectsWithRemark() {
        user.setAuditStatus(0);
        when(userMapper.selectById(1L)).thenReturn(user);

        userService.audit(1L, 2, "资料不完整");

        assertThat(user.getAuditStatus()).isEqualTo(2);
        assertThat(user.getAuditRemark()).isEqualTo("资料不完整");
    }

    private ChangePasswordRequest changePasswordRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("oldpassword1");
        req.setNewPassword("newpassword1");
        return req;
    }
}
