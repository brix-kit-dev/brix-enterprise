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
package io.brix.enterprise.app.storage.repository;

import io.brix.enterprise.app.storage.entity.FileAccessLog;
import io.brix.enterprise.app.storage.enums.AccessType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 文件访问日志仓储接口
 * 
 * <p>提供文件访问审计日志的持久化操作。
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface FileAccessLogRepository extends JpaRepository<FileAccessLog, String> {

    /**
     * 查询文件的访问日志
     *
     * @param fileId 文件ID
     * @param tenantId 租户ID
     * @param pageable 分页参数
     * @return 访问日志分页结果
     */
    @Query("SELECT l FROM FileAccessLog l WHERE l.fileId = :fileId AND l.tenantId = :tenantId " +
           "ORDER BY l.accessTime DESC")
    Page<FileAccessLog> findByFileId(
            @Param("fileId") String fileId,
            @Param("tenantId") String tenantId,
            Pageable pageable);

    /**
     * 查询操作人的访问日志
     *
     * @param operatorId 操作人ID
     * @param tenantId 租户ID
     * @param pageable 分页参数
     * @return 访问日志分页结果
     */
    @Query("SELECT l FROM FileAccessLog l WHERE l.operatorId = :operatorId AND l.tenantId = :tenantId " +
           "ORDER BY l.accessTime DESC")
    Page<FileAccessLog> findByOperatorId(
            @Param("operatorId") String operatorId,
            @Param("tenantId") String tenantId,
            Pageable pageable);

    /**
     * 按时间范围查询访问日志
     *
     * @param tenantId 租户ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param pageable 分页参数
     * @return 访问日志分页结果
     */
    @Query("SELECT l FROM FileAccessLog l WHERE l.tenantId = :tenantId " +
           "AND l.accessTime BETWEEN :startTime AND :endTime " +
           "ORDER BY l.accessTime DESC")
    Page<FileAccessLog> findByTimeRange(
            @Param("tenantId") String tenantId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable);

    /**
     * 按访问类型查询日志
     *
     * @param tenantId 租户ID
     * @param accessType 访问类型
     * @param pageable 分页参数
     * @return 访问日志分页结果
     */
    @Query("SELECT l FROM FileAccessLog l WHERE l.tenantId = :tenantId " +
           "AND l.accessType = :accessType ORDER BY l.accessTime DESC")
    Page<FileAccessLog> findByAccessType(
            @Param("tenantId") String tenantId,
            @Param("accessType") AccessType accessType,
            Pageable pageable);

    /**
     * 统计文件的访问次数
     *
     * @param fileId 文件ID
     * @param tenantId 租户ID
     * @return 访问次数
     */
    @Query("SELECT COUNT(l) FROM FileAccessLog l WHERE l.fileId = :fileId AND l.tenantId = :tenantId")
    long countByFileId(@Param("fileId") String fileId, @Param("tenantId") String tenantId);

    /**
     * 查询最近的访问日志
     *
     * @param tenantId 租户ID
     * @param limit 条数限制
     * @return 访问日志列表
     */
    @Query("SELECT l FROM FileAccessLog l WHERE l.tenantId = :tenantId " +
           "ORDER BY l.accessTime DESC LIMIT :limit")
    List<FileAccessLog> findRecentLogs(@Param("tenantId") String tenantId, @Param("limit") int limit);
}
