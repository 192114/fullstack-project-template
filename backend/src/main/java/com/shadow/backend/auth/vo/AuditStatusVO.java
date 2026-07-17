package com.shadow.backend.auth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AuditStatusVO {

    private Integer auditStatus;
    private String auditRemark;
    private String nickname;
    private String phone;
    private LocalDateTime createTime;
}
