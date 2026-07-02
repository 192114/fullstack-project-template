package com.shadow.backend.auth.service;

import com.shadow.backend.auth.vo.TokenPair;

public interface TokenService {

    TokenPair createTokens(Long userId);

    TokenPair refreshToken(String refreshToken);

    void removeTokens(String refreshToken);
}
