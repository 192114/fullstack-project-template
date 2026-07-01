package com.shadow.backend.auth.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shadow.backend.auth.dto.LoginRequest;
import com.shadow.backend.auth.dto.LoginResponse;
import com.shadow.backend.auth.service.AuthService;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.PasswordUtil;
import com.shadow.backend.user.dto.CreateUserRequest;
import com.shadow.backend.user.entity.User;
import com.shadow.backend.user.mapper.UserMapper;
import com.shadow.backend.user.response.UserResultCode;
import com.shadow.backend.user.service.UserService;
import com.shadow.backend.user.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final UserService userService;
    private final PasswordUtil passwordUtil;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername()));
        if (user == null || !passwordUtil.verify(request.getPassword(), user.getPassword())) {
            throw new BusinessException(UserResultCode.LOGIN_FAILED);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(UserResultCode.USER_DISABLED);
        }

        StpUtil.login(user.getId());
        UserVO userVO = userService.getById(user.getId());
        return new LoginResponse(StpUtil.getTokenValue(), userVO);
    }

    @Override
    public void logout() {
        StpUtil.logout();
    }

    @Override
    public UserVO register(CreateUserRequest request) {
        return userService.create(request);
    }
}
