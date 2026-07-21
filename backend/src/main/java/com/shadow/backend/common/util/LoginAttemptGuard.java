package com.shadow.backend.common.util;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** 登录失败次数限制，防止密码接口被暴力破解 */
@Component
@RequiredArgsConstructor
public class LoginAttemptGuard {

    private static final String KEY_PREFIX = "login:fail:";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_TTL = Duration.ofMinutes(15);

    private final StringRedisTemplate redisTemplate;

    public boolean isLocked(String scene, String identifier) {
        String value = redisTemplate.opsForValue().get(buildKey(scene, identifier));
        return value != null && Integer.parseInt(value) >= MAX_ATTEMPTS;
    }

    public void onLoginFailed(String scene, String identifier) {
        String key = buildKey(scene, identifier);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, LOCK_TTL);
        }
    }

    public void onLoginSucceeded(String scene, String identifier) {
        redisTemplate.delete(buildKey(scene, identifier));
    }

    private String buildKey(String scene, String identifier) {
        return KEY_PREFIX + scene + ":" + identifier;
    }
}
