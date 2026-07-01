package com.shadow.backend.auth.controller;

import com.shadow.backend.auth.dto.LoginRequest;
import com.shadow.backend.auth.dto.LoginResponse;
import com.shadow.backend.auth.service.AuthService;
import com.shadow.backend.common.response.Result;
import com.shadow.backend.user.dto.CreateUserRequest;
import com.shadow.backend.user.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Result.success();
    }

    @PostMapping("/register")
    public Result<UserVO> register(@Valid @RequestBody CreateUserRequest request) {
        return Result.success(authService.register(request));
    }
}
