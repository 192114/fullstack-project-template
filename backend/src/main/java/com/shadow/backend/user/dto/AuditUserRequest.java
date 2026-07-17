package com.shadow.backend.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuditUserRequest {

    @NotNull(message = "审核状态不能为空")
    private Integer auditStatus;

    @Size(max = 255, message = "审核备注长度不能超过 255")
    private String auditRemark;
}
