package com.shadow.backend.auth.service;

import com.shadow.backend.auth.dto.LoginRequest;
import com.shadow.backend.auth.dto.LoginResponse;
import com.shadow.backend.user.dto.CreateUserRequest;
import com.shadow.backend.user.vo.UserVO;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void logout();

    UserVO register(CreateUserRequest request);
}
