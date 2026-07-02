package com.shadow.backend.auth.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.service.TokenService;
import com.shadow.backend.auth.vo.TokenPair;
import com.shadow.backend.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private static final String REFRESH_KEY_PREFIX = "auth:refresh:";
    private static final Duration REFRESH_TTL = Duration.ofDays(7);
    private static final String SESSION_REFRESH_TOKEN_KEY = "refreshToken";

    private final StringRedisTemplate redisTemplate;

    @Override
    public TokenPair createTokens(Long userId) {
        StpUtil.login(userId);
        String accessToken = StpUtil.getTokenValue();

        String refreshToken = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(
                REFRESH_KEY_PREFIX + refreshToken,
                userId.toString(),
                REFRESH_TTL
        );

        StpUtil.getSession().set(SESSION_REFRESH_TOKEN_KEY, refreshToken);

        log.info("创建Token: userId={}", userId);
        return new TokenPair(accessToken, refreshToken);
    }

    @Override
    public TokenPair refreshToken(String refreshToken) {
        String key = REFRESH_KEY_PREFIX + refreshToken;
        String userIdStr = redisTemplate.opsForValue().get(key);

        if (userIdStr == null) {
            throw new BusinessException(AuthResultCode.REFRESH_TOKEN_INVALID);
        }

        redisTemplate.delete(key);

        Long userId = Long.parseLong(userIdStr);
        log.info("刷新Token: userId={}", userId);
        return createTokens(userId);
    }

    @Override
    public void removeTokens(String refreshToken) {
        if (refreshToken != null && !refreshToken.isEmpty()) {
            redisTemplate.delete(REFRESH_KEY_PREFIX + refreshToken);
        }
        StpUtil.logout();
        log.info("移除Token: refreshToken={}", refreshToken);
    }
}
