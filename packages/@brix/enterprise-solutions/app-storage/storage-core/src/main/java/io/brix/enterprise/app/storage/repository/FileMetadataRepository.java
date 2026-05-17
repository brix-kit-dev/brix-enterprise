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

import io.brix.enterprise.app.storage.entity.FileMetadata;
import io.brix.enterprise.app.storage.enums.BusinessType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 文件元数据仓储接口
 * 
 * <p>提供文件元数据的持久化操作，所有查询默认过滤已删除数据，并按租户隔离。
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {

    /**
     * 根据ID和租户ID查询文件（未删除）
     *
     * @param id 文件ID
     * @param tenantId 租户ID
     * @return 文件元数据
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.id = :id AND f.tenantId = :tenantId AND f.deleted = false")
    Optional<FileMetadata> findByIdAndTenantId(@Param("id") String id, @Param("tenantId") String tenantId);

    /**
     * 根据业务类型和实体ID查询文件列表
     *
     * @param tenantId 租户ID
     * @param businessType 业务类型
     * @param entityId 关联实体ID
     * @return 文件列表
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.businessType = :businessType AND f.entityId = :entityId " +
           "AND f.deleted = false ORDER BY f.createdAt DESC")
    List<FileMetadata> findByTenantAndBusinessTypeAndEntityId(
            @Param("tenantId") String tenantId,
            @Param("businessType") BusinessType businessType,
            @Param("entityId") String entityId);

    /**
     * 分页查询文件列表
     *
     * @param tenantId 租户ID
     * @param pageable 分页参数
     * @return 文件分页结果
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId AND f.deleted = false " +
           "ORDER BY f.createdAt DESC")
    Page<FileMetadata> findByTenantId(@Param("tenantId") String tenantId, Pageable pageable);

    /**
     * 按业务类型分页查询文件列表
     *
     * @param tenantId 租户ID
     * @param businessType 业务类型
     * @param pageable 分页参数
     * @return 文件分页结果
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.businessType = :businessType AND f.deleted = false " +
           "ORDER BY f.createdAt DESC")
    Page<FileMetadata> findByTenantIdAndBusinessType(
            @Param("tenantId") String tenantId,
            @Param("businessType") BusinessType businessType,
            Pageable pageable);

    /**
     * 按关键词搜索文件名
     *
     * @param tenantId 租户ID
     * @param keyword 关键词
     * @param pageable 分页参数
     * @return 文件分页结果
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId AND f.deleted = false " +
           "AND LOWER(f.originalName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY f.createdAt DESC")
    Page<FileMetadata> searchByName(
            @Param("tenantId") String tenantId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 按业务类型和关键词搜索
     *
     * @param tenantId 租户ID
     * @param businessType 业务类型
     * @param keyword 关键词
     * @param pageable 分页参数
     * @return 文件分页结果
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.businessType = :businessType AND f.deleted = false " +
           "AND LOWER(f.originalName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY f.createdAt DESC")
    Page<FileMetadata> searchByBusinessTypeAndName(
            @Param("tenantId") String tenantId,
            @Param("businessType") BusinessType businessType,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 根据MD5哈希查找文件（用于去重）
     *
     * @param tenantId 租户ID
     * @param md5Hash MD5哈希值
     * @return 文件列表
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.md5Hash = :md5Hash AND f.deleted = false")
    List<FileMetadata> findByMd5Hash(@Param("tenantId") String tenantId, @Param("md5Hash") String md5Hash);

    /**
     * 统计租户下的文件数量
     *
     * @param tenantId 租户ID
     * @return 文件数量
     */
    @Query("SELECT COUNT(f) FROM FileMetadata f WHERE f.tenantId = :tenantId AND f.deleted = false")
    long countByTenantId(@Param("tenantId") String tenantId);

    /**
     * 按业务类型统计文件数量
     *
     * @param tenantId 租户ID
     * @param businessType 业务类型
     * @return 文件数量
     */
    @Query("SELECT COUNT(f) FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.businessType = :businessType AND f.deleted = false")
    long countByTenantIdAndBusinessType(
            @Param("tenantId") String tenantId,
            @Param("businessType") BusinessType businessType);

    /**
     * 批量查询文件
     *
     * @param tenantId 租户ID
     * @param ids 文件ID列表
     * @return 文件列表
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.tenantId = :tenantId " +
           "AND f.id IN :ids AND f.deleted = false")
    List<FileMetadata> findByIds(@Param("tenantId") String tenantId, @Param("ids") List<String> ids);
}
