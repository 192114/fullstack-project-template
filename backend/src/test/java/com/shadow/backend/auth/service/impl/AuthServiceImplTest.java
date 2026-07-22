package com.shadow.backend.auth.service.impl;

import com.shadow.backend.auth.constant.SmsScene;
import com.shadow.backend.auth.dto.PasswordLoginRequest;
import com.shadow.backend.auth.dto.RegisterRequest;
import com.shadow.backend.auth.dto.RegisterResponse;
import com.shadow.backend.auth.dto.ResetPasswordRequest;
import com.shadow.backend.auth.dto.ResubmitRequest;
import com.shadow.backend.auth.dto.SmsLoginRequest;
import com.shadow.backend.auth.dto.LoginResponse;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.service.SmsService;
import com.shadow.backend.auth.service.TokenService;
import com.shadow.backend.auth.vo.TokenPair;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.LoginAttemptGuard;
import com.shadow.backend.common.util.PasswordUtil;
import com.shadow.backend.user.constant.AuditStatus;
import com.shadow.backend.user.entity.User;
import com.shadow.backend.user.mapper.UserMapper;
import com.shadow.backend.user.response.UserResultCode;
import com.shadow.backend.user.service.UserService;
import com.shadow.backend.user.vo.UserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String LOGIN_ATTEMPT_SCENE = "app-password";
    private static final String PHONE = "13800138000";

    @Mock
    private UserMapper userMapper;
    @Mock
    private UserService userService;
    @Mock
    private PasswordUtil passwordUtil;
    @Mock
    private SmsService smsService;
    @Mock
    private TokenService tokenService;
    @Mock
    private LoginAttemptGuard loginAttemptGuard;

    @InjectMocks
    private AuthServiceImpl authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setPhone(PHONE);
        activeUser.setPassword("hashed");
        activeUser.setStatus(1);
        activeUser.setAuditStatus(AuditStatus.APPROVED.getValue());
    }

    // ---------- loginByPassword ----------

    @Test
    void loginByPassword_whenLocked_throwsLoginLocked() {
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(true);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.LOGIN_LOCKED.getCode());

        verify(userService, never()).getByPhone(anyString());
    }

    @Test
    void loginByPassword_whenPasswordWrong_recordsFailureAndThrows() {
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.verify(req.getPassword(), activeUser.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.LOGIN_FAILED.getCode());

        verify(loginAttemptGuard).onLoginFailed(LOGIN_ATTEMPT_SCENE, PHONE);
        verify(loginAttemptGuard, never()).onLoginSucceeded(anyString(), anyString());
    }

    @Test
    void loginByPassword_whenUserNotFound_recordsFailureAndThrowsLoginFailed() {
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(null);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.LOGIN_FAILED.getCode());

        verify(loginAttemptGuard).onLoginFailed(LOGIN_ATTEMPT_SCENE, PHONE);
    }

    @Test
    void loginByPassword_whenSuccess_clearsAttemptsAndReturnsTokens() {
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.verify(req.getPassword(), activeUser.getPassword())).thenReturn(true);
        when(tokenService.createTokens(activeUser.getId())).thenReturn(new TokenPair("access", "refresh"));
        UserVO vo = new UserVO();
        vo.setId(activeUser.getId());
        when(userService.getById(activeUser.getId())).thenReturn(vo);

        LoginResponse response = authService.loginByPassword(req);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        verify(loginAttemptGuard).onLoginSucceeded(LOGIN_ATTEMPT_SCENE, PHONE);
        verify(loginAttemptGuard, never()).onLoginFailed(anyString(), anyString());
    }

    @Test
    void loginByPassword_whenAuditPending_throwsAuditPending() {
        activeUser.setAuditStatus(AuditStatus.PENDING.getValue());
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.verify(req.getPassword(), activeUser.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.USER_AUDIT_PENDING.getCode());
    }

    @Test
    void loginByPassword_whenAuditRejected_throwsWithRemarkAppended() {
        activeUser.setAuditStatus(AuditStatus.REJECTED.getValue());
        activeUser.setAuditRemark("资料不完整");
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.verify(req.getPassword(), activeUser.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("资料不完整");
    }

    @Test
    void loginByPassword_whenUserDisabled_throwsUserDisabled() {
        activeUser.setStatus(0);
        PasswordLoginRequest req = passwordLoginRequest();
        when(loginAttemptGuard.isLocked(LOGIN_ATTEMPT_SCENE, PHONE)).thenReturn(false);
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.verify(req.getPassword(), activeUser.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.loginByPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(UserResultCode.USER_DISABLED.getCode());
    }

    // ---------- loginBySms ----------

    @Test
    void loginBySms_whenPhoneNotRegistered_throws() {
        SmsLoginRequest req = new SmsLoginRequest();
        req.setPhone(PHONE);
        req.setCode("123456");
        when(userService.getByPhone(PHONE)).thenReturn(null);

        assertThatThrownBy(() -> authService.loginBySms(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.PHONE_NOT_REGISTERED.getCode());

        verify(smsService).verifyCode(PHONE, SmsScene.LOGIN, "123456");
    }

    // ---------- register ----------

    @Test
    void register_whenPhoneAlreadyRegistered_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(PHONE);
        req.setPassword("password1");
        req.setCode("123456");
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.PHONE_ALREADY_REGISTERED.getCode());

        verify(userMapper, never()).insert(any(User.class));
    }

    @Test
    void register_whenSuccess_createsUserWithPendingAuditStatus() {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(PHONE);
        req.setPassword("password1");
        req.setCode("123456");
        when(userService.getByPhone(PHONE)).thenReturn(null);
        when(passwordUtil.hash("password1")).thenReturn("hashed-pwd");
        UserVO vo = new UserVO();
        when(userService.getById(any())).thenReturn(vo);

        RegisterResponse response = authService.register(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(captor.capture());
        User inserted = captor.getValue();
        assertThat(inserted.getPhone()).isEqualTo(PHONE);
        assertThat(inserted.getPassword()).isEqualTo("hashed-pwd");
        assertThat(inserted.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getValue());
        assertThat(response.getUser()).isSameAs(vo);
    }

    // ---------- resubmit ----------

    @Test
    void resubmit_whenNotRejected_throws() {
        activeUser.setAuditStatus(AuditStatus.PENDING.getValue());
        ResubmitRequest req = resubmitRequest();
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);

        assertThatThrownBy(() -> authService.resubmit(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.RESUBMIT_NOT_REJECTED.getCode());

        verify(userMapper, never()).updateById(any(User.class));
    }

    @Test
    void resubmit_whenRejected_resetsToPendingAndClearsRemark() {
        activeUser.setAuditStatus(AuditStatus.REJECTED.getValue());
        activeUser.setAuditRemark("资料不完整");
        ResubmitRequest req = resubmitRequest();
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.hash(req.getPassword())).thenReturn("new-hashed");
        UserVO vo = new UserVO();
        when(userService.getById(activeUser.getId())).thenReturn(vo);

        RegisterResponse response = authService.resubmit(req);

        verify(userMapper).updateById(activeUser);
        assertThat(activeUser.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getValue());
        assertThat(activeUser.getAuditRemark()).isNull();
        assertThat(activeUser.getPassword()).isEqualTo("new-hashed");
        assertThat(response.getUser()).isSameAs(vo);
    }

    @Test
    void resubmit_whenPhoneNotRegistered_throws() {
        ResubmitRequest req = resubmitRequest();
        when(userService.getByPhone(PHONE)).thenReturn(null);

        assertThatThrownBy(() -> authService.resubmit(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.PHONE_NOT_REGISTERED.getCode());
    }

    // ---------- resetPassword ----------

    @Test
    void resetPassword_whenPhoneNotRegistered_throws() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setPhone(PHONE);
        req.setNewPassword("newpassword1");
        req.setCode("123456");
        when(userService.getByPhone(PHONE)).thenReturn(null);

        assertThatThrownBy(() -> authService.resetPassword(req))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.PHONE_NOT_REGISTERED.getCode());

        verify(userMapper, never()).updateById(any(User.class));
    }

    @Test
    void resetPassword_whenSuccess_updatesHashedPassword() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setPhone(PHONE);
        req.setNewPassword("newpassword1");
        req.setCode("123456");
        when(userService.getByPhone(PHONE)).thenReturn(activeUser);
        when(passwordUtil.hash("newpassword1")).thenReturn("hashed-new");

        authService.resetPassword(req);

        assertThat(activeUser.getPassword()).isEqualTo("hashed-new");
        verify(userMapper).updateById(activeUser);
    }

    // ---------- helpers ----------

    private PasswordLoginRequest passwordLoginRequest() {
        PasswordLoginRequest req = new PasswordLoginRequest();
        req.setPhone(PHONE);
        req.setPassword("password1");
        return req;
    }

    private ResubmitRequest resubmitRequest() {
        ResubmitRequest req = new ResubmitRequest();
        req.setPhone(PHONE);
        req.setPassword("newpassword1");
        req.setCode("123456");
        return req;
    }
}
