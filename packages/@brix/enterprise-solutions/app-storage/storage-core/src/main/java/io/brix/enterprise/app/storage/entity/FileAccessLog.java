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
package io.brix.enterprise.app.storage.entity;

import io.brix.enterprise.app.storage.enums.AccessType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 文件访问日志实体
 * 
 * <p>记录所有文件访问操作，用于审计和合规。
 * 
 * <h3>记录的操作类型</h3>
 * <ul>
 *   <li>UPLOAD - 文件上传</li>
 *   <li>DOWNLOAD - 文件下载</li>
 *   <li>PREVIEW - 文件预览</li>
 *   <li>DELETE - 文件删除</li>
 *   <li>VIEW_METADATA - 查看文件信息</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "storage_access_log", indexes = {
    @Index(name = "idx_access_log_file", columnList = "file_id"),
    @Index(name = "idx_access_log_tenant", columnList = "tenant_id"),
    @Index(name = "idx_access_log_operator", columnList = "tenant_id, operator_id"),
    @Index(name = "idx_access_log_time", columnList = "tenant_id, access_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileAccessLog {

    /**
     * 日志ID
     */
    @Id
    @Column(name = "id", length = 64)
    private String id;

    /**
     * 租户ID
     */
    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    /**
     * 文件ID
     */
    @Column(name = "file_id", nullable = false, length = 64)
    private String fileId;

    /**
     * 文件名
     * 冗余存储，便于查询展示
     */
    @Column(name = "file_name", length = 300)
    private String fileName;

    /**
     * 访问类型
     */
    @Column(name = "access_type", nullable = false, length = 32)
    @Enumerated(EnumType.STRING)
    private AccessType accessType;

    /**
     * 操作人ID
     */
    @Column(name = "operator_id", nullable = false, length = 64)
    private String operatorId;

    /**
     * 客户端IP地址
     */
    @Column(name = "client_ip", length = 50)
    private String clientIp;

    /**
     * 用户代理（浏览器信息）
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 访问时间
     */
    @Column(name = "access_time", nullable = false)
    private LocalDateTime accessTime;

    /**
     * 操作结果
     * success / failed
     */
    @Column(name = "result", length = 20)
    @Builder.Default
    private String result = "success";

    /**
     * 失败原因
     */
    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    /**
     * 文件大小（上传时记录）
     */
    @Column(name = "file_size")
    private Long fileSize;

    // =====================================================
    // 工厂方法
    // =====================================================

    /**
     * 创建成功日志
     */
    public static FileAccessLog success(String tenantId, String fileId, String fileName,
                                        AccessType accessType, String operatorId,
                                        String clientIp, String userAgent) {
        return FileAccessLog.builder()
                .id(java.util.UUID.randomUUID().toString())
                .tenantId(tenantId)
                .fileId(fileId)
                .fileName(fileName)
                .accessType(accessType)
                .operatorId(operatorId)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .accessTime(LocalDateTime.now())
                .result("success")
                .build();
    }

    /**
     * 创建失败日志
     */
    public static FileAccessLog failed(String tenantId, String fileId, String fileName,
                                       AccessType accessType, String operatorId,
                                       String clientIp, String userAgent, String reason) {
        return FileAccessLog.builder()
                .id(java.util.UUID.randomUUID().toString())
                .tenantId(tenantId)
                .fileId(fileId)
                .fileName(fileName)
                .accessType(accessType)
                .operatorId(operatorId)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .accessTime(LocalDateTime.now())
                .result("failed")
                .failureReason(reason)
                .build();
    }
}
