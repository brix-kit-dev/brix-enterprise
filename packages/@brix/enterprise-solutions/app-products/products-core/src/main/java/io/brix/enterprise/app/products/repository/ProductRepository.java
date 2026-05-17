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
package io.brix.enterprise.app.products.repository;

import io.brix.enterprise.app.products.entity.Product;
import io.brix.enterprise.app.products.enums.ProductStatus;
import io.brix.enterprise.app.products.enums.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 产品仓储接口
 *
 * <p>定义产品实体的数据访问操作，继承 JpaRepository 获得基础 CRUD 能力。
 *
 * <p>查询方法说明：
 * <ul>
 *   <li>所有查询默认过滤已删除的记录（deleted = false）</li>
 *   <li>租户隔离通过 tenantId 参数实现</li>
 *   <li>支持按状态、类型、合作方等条件查询</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // =====================================================
    // 基础查询（带租户隔离和软删除过滤）
    // =====================================================

    /**
     * 根据 ID 和租户 ID 查询产品
     *
     * @param id 产品 ID
     * @param tenantId 租户 ID
     * @return 产品实体（如果存在且未删除）
     */
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.tenantId = :tenantId AND p.deleted = false")
    Optional<Product> findByIdAndTenantId(@Param("id") Long id, @Param("tenantId") String tenantId);

    /**
     * 查询租户下所有未删除的产品
     *
     * @param tenantId 租户 ID
     * @return 产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC, p.createdAt DESC")
    List<Product> findAllByTenantId(@Param("tenantId") String tenantId);

    // =====================================================
    // 状态查询
    // =====================================================

    /**
     * 根据状态查询产品
     *
     * @param status 产品状态
     * @param tenantId 租户 ID
     * @return 产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC")
    List<Product> findByStatusAndTenantId(@Param("status") ProductStatus status, @Param("tenantId") String tenantId);

    /**
     * 查询上架的产品（对外展示）
     *
     * @param tenantId 租户 ID
     * @return 上架产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC")
    List<Product> findActiveProductsByTenantId(@Param("tenantId") String tenantId);

    // =====================================================
    // 类型查询
    // =====================================================

    /**
     * 根据类型查询产品
     *
     * @param type 产品类型
     * @param tenantId 租户 ID
     * @return 产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.type = :type AND p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC")
    List<Product> findByTypeAndTenantId(@Param("type") ProductType type, @Param("tenantId") String tenantId);

    // =====================================================
    // 合作方查询
    // =====================================================

    /**
     * 根据合作方 ID 查询产品
     *
     * @param partnerId 合作方 ID
     * @param tenantId 租户 ID
     * @return 产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.partnerId = :partnerId AND p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC")
    List<Product> findByPartnerIdAndTenantId(@Param("partnerId") Long partnerId, @Param("tenantId") String tenantId);

    // =====================================================
    // 分类查询
    // =====================================================

    /**
     * 根据分类 ID 查询产品
     *
     * @param categoryId 分类 ID
     * @param tenantId 租户 ID
     * @return 产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.categoryId = :categoryId AND p.tenantId = :tenantId AND p.deleted = false ORDER BY p.sortOrder ASC")
    List<Product> findByCategoryIdAndTenantId(@Param("categoryId") Long categoryId, @Param("tenantId") String tenantId);

    // =====================================================
    // 名称校验
    // =====================================================

    /**
     * 检查产品名称是否已存在
     *
     * @param name 产品名称
     * @param tenantId 租户 ID
     * @return 如果存在返回 true
     */
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.name = :name AND p.tenantId = :tenantId AND p.deleted = false")
    boolean existsByNameAndTenantId(@Param("name") String name, @Param("tenantId") String tenantId);

    /**
     * 检查产品名称是否已存在（排除指定 ID）
     *
     * @param name 产品名称
     * @param id 排除的产品 ID
     * @param tenantId 租户 ID
     * @return 如果存在返回 true
     */
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.name = :name AND p.id != :id AND p.tenantId = :tenantId AND p.deleted = false")
    boolean existsByNameAndIdNotAndTenantId(@Param("name") String name, @Param("id") Long id, @Param("tenantId") String tenantId);

    // =====================================================
    // 搜索查询
    // =====================================================

    /**
     * 根据关键字搜索产品
     *
     * <p>搜索范围：名称、描述
     *
     * @param keyword 搜索关键字
     * @param tenantId 租户 ID
     * @return 匹配的产品列表
     */
    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.deleted = false AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.sortOrder ASC")
    List<Product> searchByKeywordAndTenantId(@Param("keyword") String keyword, @Param("tenantId") String tenantId);

    // =====================================================
    // 统计查询
    // =====================================================

    /**
     * 统计租户下的产品数量
     *
     * @param tenantId 租户 ID
     * @return 产品数量
     */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.tenantId = :tenantId AND p.deleted = false")
    long countByTenantId(@Param("tenantId") String tenantId);

    /**
     * 统计租户下某状态的产品数量
     *
     * @param status 产品状态
     * @param tenantId 租户 ID
     * @return 产品数量
     */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = :status AND p.tenantId = :tenantId AND p.deleted = false")
    long countByStatusAndTenantId(@Param("status") ProductStatus status, @Param("tenantId") String tenantId);
}
