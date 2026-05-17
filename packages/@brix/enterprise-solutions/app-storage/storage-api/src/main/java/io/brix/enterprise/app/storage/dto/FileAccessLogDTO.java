/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.storage.dto;

import io.brix.enterprise.app.storage.enums.AccessType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文件访问日志DTO
 * 
 * <p>文件访问审计记录，用于合规审查和追溯。
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileAccessLogDTO {

    /**
     * 日志ID
     */
    private String id;

    /**
     * 文件ID
     */
    private String fileId;

    /**
     * 文件名
     */
    private String fileName;

    /**
     * 访问类型
     */
    private AccessType accessType;

    /**
     * 操作人ID
     */
    private String operatorId;

    /**
     * 操作人姓名
     */
    private String operatorName;

    /**
     * 客户端IP地址
     */
    private String clientIp;

    /**
     * 用户代理（浏览器信息）
     */
    private String userAgent;

    /**
     * 访问时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime accessTime;

    /**
     * 操作结果
     * success / failed
     */
    private String result;

    /**
     * 失败原因（如有）
     */
    private String failureReason;

    /**
     * 租户ID
     */
    private String tenantId;
}
