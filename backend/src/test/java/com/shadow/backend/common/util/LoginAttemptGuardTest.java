package com.shadow.backend.common.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptGuardTest {

    private static final String SCENE = "app-password";
    private static final String IDENTIFIER = "13800138000";
    private static final String KEY = "login:fail:" + SCENE + ":" + IDENTIFIER;

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private LoginAttemptGuard loginAttemptGuard;

    @Test
    void isLocked_whenNoRecord_returnsFalse() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(KEY)).thenReturn(null);

        assertThat(loginAttemptGuard.isLocked(SCENE, IDENTIFIER)).isFalse();
    }

    @Test
    void isLocked_whenBelowThreshold_returnsFalse() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(KEY)).thenReturn("4");

        assertThat(loginAttemptGuard.isLocked(SCENE, IDENTIFIER)).isFalse();
    }

    @Test
    void isLocked_whenAtOrAboveThreshold_returnsTrue() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(KEY)).thenReturn("5");

        assertThat(loginAttemptGuard.isLocked(SCENE, IDENTIFIER)).isTrue();
    }

    @Test
    void onLoginFailed_whenFirstFailure_setsExpiry() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(KEY)).thenReturn(1L);

        loginAttemptGuard.onLoginFailed(SCENE, IDENTIFIER);

        verify(redisTemplate).expire(KEY, Duration.ofMinutes(15));
    }

    @Test
    void onLoginFailed_whenSubsequentFailure_doesNotResetExpiry() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(KEY)).thenReturn(3L);

        loginAttemptGuard.onLoginFailed(SCENE, IDENTIFIER);

        verify(redisTemplate, never()).expire(KEY, Duration.ofMinutes(15));
    }

    @Test
    void onLoginSucceeded_clearsFailureCounter() {
        loginAttemptGuard.onLoginSucceeded(SCENE, IDENTIFIER);

        verify(redisTemplate).delete(KEY);
    }
}
