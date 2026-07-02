package com.shadow.backend.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shadow.backend.auth.constant.SmsScene;
import com.shadow.backend.auth.entity.SmsLog;
import com.shadow.backend.auth.mapper.SmsLogMapper;
import com.shadow.backend.auth.response.AuthResultCode;
import com.shadow.backend.auth.service.SmsSender;
import com.shadow.backend.auth.service.SmsService;
import com.shadow.backend.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsServiceImpl implements SmsService {

    private static final String CODE_KEY_PREFIX = "sms:code:";
    private static final String LIMIT_KEY_PREFIX = "sms:limit:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration LIMIT_TTL = Duration.ofSeconds(60);

    private final StringRedisTemplate redisTemplate;
    private final SmsLogMapper smsLogMapper;
    private final SmsSender smsSender;

    @Override
    public void sendCode(String phone, SmsScene scene) {
        String limitKey = LIMIT_KEY_PREFIX + phone;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(limitKey, "1", LIMIT_TTL);
        if (Boolean.FALSE.equals(acquired)) {
            throw new BusinessException(AuthResultCode.SMS_CODE_SEND_TOO_FREQUENT);
        }

        String code = generateCode();
        String codeKey = CODE_KEY_PREFIX + scene.name() + ":" + phone;
        redisTemplate.opsForValue().set(codeKey, code, CODE_TTL);

        SmsLog smsLog = new SmsLog();
        smsLog.setPhone(phone);
        smsLog.setScene(scene.name());
        smsLog.setCode(code);
        smsLog.setStatus(0);
        smsLog.setSendTime(LocalDateTime.now());
        smsLogMapper.insert(smsLog);

        smsSender.send(phone, code);
        log.info("验证码已发送: phone={}, scene={}", phone, scene);
    }

    @Override
    public void verifyCode(String phone, SmsScene scene, String code) {
        String codeKey = CODE_KEY_PREFIX + scene.name() + ":" + phone;
        String storedCode = redisTemplate.opsForValue().get(codeKey);

        if (storedCode == null) {
            throw new BusinessException(AuthResultCode.SMS_CODE_NOT_FOUND);
        }

        if (!storedCode.equals(code)) {
            throw new BusinessException(AuthResultCode.SMS_CODE_INVALID);
        }

        redisTemplate.delete(codeKey);

        SmsLog latestLog = smsLogMapper.selectOne(new LambdaQueryWrapper<SmsLog>()
                .eq(SmsLog::getPhone, phone)
                .eq(SmsLog::getScene, scene.name())
                .eq(SmsLog::getStatus, 0)
                .orderByDesc(SmsLog::getId)
                .last("LIMIT 1"));
        if (latestLog != null) {
            latestLog.setStatus(1);
            latestLog.setVerifiedTime(LocalDateTime.now());
            smsLogMapper.updateById(latestLog);
        }
    }

    private String generateCode() {
        int code = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(code);
    }
}
