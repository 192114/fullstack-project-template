package com.shadow.backend.auth.dto;

import com.shadow.backend.user.vo.UserVO;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private UserVO user;
}
