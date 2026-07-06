package com.shadow.backend.auth.service.impl;

import com.shadow.backend.common.util.StpAppUtil;
import com.shadow.backend.auth.constant.SmsScene;
import com.shadow.backend.auth.dto.LoginResponse;
import com.shadow.backend.auth.dto.PasswordLoginRequest;
import com.shadow.backend.auth.dto.RefreshTokenRequest;
import com.shadow.backend.auth.dto.RegisterRequest;
import com.shadow.backend.auth.dto.ResetPasswordRequest;
import com.shadow.backend.auth.dto.SmsLoginRequest;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.service.AuthService;
import com.shadow.backend.auth.service.SmsService;
import com.shadow.backend.auth.service.TokenService;
import com.shadow.backend.auth.vo.RefreshTokenResponse;
import com.shadow.backend.auth.vo.TokenPair;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.LoginUserUtil;
import com.shadow.backend.common.util.PasswordUtil;
import com.shadow.backend.user.entity.User;
import com.shadow.backend.user.mapper.UserMapper;
import com.shadow.backend.user.response.UserResultCode;
import com.shadow.backend.user.service.UserService;
import com.shadow.backend.user.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final UserService userService;
    private final PasswordUtil passwordUtil;
    private final SmsService smsService;
    private final TokenService tokenService;

    @Override
    public LoginResponse loginByPassword(PasswordLoginRequest req) {
        User user = userService.getByPhone(req.getPhone());
        if (user == null || !passwordUtil.verify(req.getPassword(), user.getPassword())) {
            throw new BusinessException(UserResultCode.LOGIN_FAILED);
        }
        checkUserStatus(user);
        return buildLoginResponse(user);
    }

    @Override
    public LoginResponse loginBySms(SmsLoginRequest req) {
        smsService.verifyCode(req.getPhone(), SmsScene.LOGIN, req.getCode());
        User user = userService.getByPhone(req.getPhone());
        if (user == null) {
            throw new BusinessException(AuthResultCode.PHONE_NOT_REGISTERED);
        }
        checkUserStatus(user);
        return buildLoginResponse(user);
    }

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest req) {
        smsService.verifyCode(req.getPhone(), SmsScene.REGISTER, req.getCode());

        User existing = userService.getByPhone(req.getPhone());
        if (existing != null) {
            throw new BusinessException(AuthResultCode.PHONE_ALREADY_REGISTERED);
        }

        User user = new User();
        user.setPhone(req.getPhone());
        user.setPassword(passwordUtil.hash(req.getPassword()));
        user.setNickname(StringUtils.hasText(req.getNickname()) ? req.getNickname() : "用户" + maskPhone(req.getPhone()));
        user.setStatus(1);
        userMapper.insert(user);

        log.info("用户注册成功: phone={}", req.getPhone());
        return buildLoginResponse(user);
    }

    @Override
    public RefreshTokenResponse refresh(RefreshTokenRequest req) {
        TokenPair tokenPair = tokenService.refreshToken(req.getRefreshToken());
        return new RefreshTokenResponse(tokenPair.getAccessToken(), tokenPair.getRefreshToken());
    }

    @Override
    public void logout() {
        String refreshToken = (String) StpAppUtil.getSession().get("refreshToken");
        tokenService.removeTokens(refreshToken);
    }

    @Override
    public UserVO getCurrentUser() {
        return userService.getById(LoginUserUtil.currentUserId());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        smsService.verifyCode(req.getPhone(), SmsScene.RESET_PASSWORD, req.getCode());
        User user = userService.getByPhone(req.getPhone());
        if (user == null) {
            throw new BusinessException(AuthResultCode.PHONE_NOT_REGISTERED);
        }
        user.setPassword(passwordUtil.hash(req.getNewPassword()));
        userMapper.updateById(user);
        log.info("密码重置成功: phone={}", req.getPhone());
    }

    private void checkUserStatus(User user) {
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(UserResultCode.USER_DISABLED);
        }
    }

    private LoginResponse buildLoginResponse(User user) {
        TokenPair tokenPair = tokenService.createTokens(user.getId());
        UserVO userVO = userService.getById(user.getId());
        return new LoginResponse(tokenPair.getAccessToken(), tokenPair.getRefreshToken(), userVO);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
