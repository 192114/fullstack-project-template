package com.shadow.backend.auth.service.impl;

import com.shadow.backend.auth.constant.SmsScene;
import com.shadow.backend.auth.entity.SmsLog;
import com.shadow.backend.auth.mapper.SmsLogMapper;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.service.SmsSender;
import com.shadow.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmsServiceImplTest {

    private static final String PHONE = "13800138000";

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private SmsLogMapper smsLogMapper;
    @Mock
    private SmsSender smsSender;

    @InjectMocks
    private SmsServiceImpl smsService;

    @Test
    void sendCode_whenRateLimited_throwsTooFrequent() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:limit:" + PHONE), eq("1"), any(Duration.class)))
                .thenReturn(false);

        assertThatThrownBy(() -> smsService.sendCode(PHONE, SmsScene.REGISTER))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.SMS_CODE_SEND_TOO_FREQUENT.getCode());

        verify(smsSender, never()).send(anyString(), anyString());
        verify(smsLogMapper, never()).insert(any(SmsLog.class));
    }

    @Test
    void sendCode_whenAllowed_storesCodeAndSendsSms() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("sms:limit:" + PHONE), eq("1"), any(Duration.class)))
                .thenReturn(true);

        smsService.sendCode(PHONE, SmsScene.REGISTER);

        verify(valueOperations).set(
                eq("sms:code:REGISTER:" + PHONE),
                anyString(),
                eq(Duration.ofMinutes(5))
        );
        verify(smsLogMapper).insert(any(SmsLog.class));
        verify(smsSender).send(eq(PHONE), anyString());
    }

    @Test
    void verifyCode_whenCodeNotFound_throws() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:code:LOGIN:" + PHONE)).thenReturn(null);

        assertThatThrownBy(() -> smsService.verifyCode(PHONE, SmsScene.LOGIN, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.SMS_CODE_NOT_FOUND.getCode());
    }

    @Test
    void verifyCode_whenCodeMismatch_throws() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:code:LOGIN:" + PHONE)).thenReturn("111111");

        assertThatThrownBy(() -> smsService.verifyCode(PHONE, SmsScene.LOGIN, "222222"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo(AuthResultCode.SMS_CODE_INVALID.getCode());

        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void verifyCode_whenValid_deletesCodeAndMarksLatestLogVerified() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:code:LOGIN:" + PHONE)).thenReturn("111111");
        SmsLog latestLog = new SmsLog();
        latestLog.setId(9L);
        latestLog.setStatus(0);
        when(smsLogMapper.selectOne(any())).thenReturn(latestLog);

        smsService.verifyCode(PHONE, SmsScene.LOGIN, "111111");

        verify(redisTemplate).delete("sms:code:LOGIN:" + PHONE);
        verify(smsLogMapper).updateById(latestLog);
        org.assertj.core.api.Assertions.assertThat(latestLog.getStatus()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(latestLog.getVerifiedTime()).isNotNull();
    }

    @Test
    void verifyCode_whenValid_butNoMatchingLog_stillSucceedsWithoutUpdate() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:code:LOGIN:" + PHONE)).thenReturn("111111");
        when(smsLogMapper.selectOne(any())).thenReturn(null);

        smsService.verifyCode(PHONE, SmsScene.LOGIN, "111111");

        verify(redisTemplate).delete("sms:code:LOGIN:" + PHONE);
        verify(smsLogMapper, never()).updateById(any(SmsLog.class));
    }
}
