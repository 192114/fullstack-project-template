package com.shadow.backend.auth.service.impl;

import com.shadow.backend.auth.service.SmsSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LogSmsSender implements SmsSender {

    @Override
    public void send(String phone, String code) {
        log.info("短信验证码发送: phone={}, code={}", phone, code);
    }
}
