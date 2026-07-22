package com.shadow.backend.auth.service.impl;

import cn.dev33.satoken.session.SaSession;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.vo.TokenPair;
import com.shadow.backend.common.exception.BusinessException;
import com.shadow.backend.common.util.StpAppUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenServiceImplTest {

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private SaSession saSession;

    @InjectMocks
    private TokenServiceImpl tokenService;

    @Test
    void createTokens_storesRefreshTokenInRedisAndSession() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        try (MockedStatic<StpAppUtil> stpAppUtil = Mockito.mockStatic(StpAppUtil.class)) {
            stpAppUtil.when(() -> StpAppUtil.getTokenValue()).thenReturn("access-token");
            stpAppUtil.when(StpAppUtil::getSession).thenReturn(saSession);

            TokenPair tokens = tokenService.createTokens(1L);

            stpAppUtil.verify(() -> StpAppUtil.login(1L));
            assertThat(tokens.getAccessToken()).isEqualTo("access-token");
            assertThat(tokens.getRefreshToken()).isNotBlank();

            verify(valueOperations).set(
                    eq("auth:refresh:" + tokens.getRefreshToken()),
                    eq("1"),
                    eq(Duration.ofDays(7))
            );
            verify(saSession).set("refreshToken", tokens.getRefreshToken());
        }
    }

    @Test
    void refreshToken_whenNotFound_throwsInvalid() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:refresh:bad-token")).thenReturn(null);

        assertThatThrownBy(() -> tokenService.refreshToken("bad-token"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.REFRESH_TOKEN_INVALID.getCode());

        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void refreshToken_whenValid_rotatesOldTokenForNewPair() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("auth:refresh:old-token")).thenReturn("42");

        try (MockedStatic<StpAppUtil> stpAppUtil = Mockito.mockStatic(StpAppUtil.class)) {
            stpAppUtil.when(() -> StpAppUtil.getTokenValue()).thenReturn("new-access-token");
            stpAppUtil.when(StpAppUtil::getSession).thenReturn(saSession);

            TokenPair tokens = tokenService.refreshToken("old-token");

            verify(redisTemplate).delete("auth:refresh:old-token");
            stpAppUtil.verify(() -> StpAppUtil.login(42L));
            assertThat(tokens.getAccessToken()).isEqualTo("new-access-token");
            assertThat(tokens.getRefreshToken()).isNotEqualTo("old-token");
        }
    }

    @Test
    void removeTokens_whenRefreshTokenPresent_deletesRedisKeyAndLogsOut() {
        try (MockedStatic<StpAppUtil> stpAppUtil = Mockito.mockStatic(StpAppUtil.class)) {
            tokenService.removeTokens("some-token");

            verify(redisTemplate).delete("auth:refresh:some-token");
            stpAppUtil.verify(StpAppUtil::logout);
        }
    }

    @Test
    void removeTokens_whenRefreshTokenBlank_skipsRedisDeleteButStillLogsOut() {
        try (MockedStatic<StpAppUtil> stpAppUtil = Mockito.mockStatic(StpAppUtil.class)) {
            tokenService.removeTokens("");

            verify(redisTemplate, never()).delete(anyString());
            stpAppUtil.verify(StpAppUtil::logout);
        }
    }
}
