/*
 * Copyright 2026 Shinwa Solutions
 *
 * 合作伙伴数据仓储
 */
package com.shinwa.app.partners.repository;

import com.shinwa.app.partners.entity.Partner;
import com.shinwa.app.partners.enums.PartnerStatus;
import com.shinwa.app.partners.enums.PartnerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 合作伙伴数据仓储接口
 *
 * <p>继承 JpaRepository 提供基础的 CRUD 操作，并定义自定义查询方法。
 * 所有查询默认过滤已删除的记录。</p>
 *
 * <h3>查询规范</h3>
 * <ul>
 *   <li>所有租户相关查询需传入 tenantId 参数</li>
 *   <li>默认过滤 deleted = true 的记录</li>
 *   <li>使用命名参数提高可读性</li>
 * </ul>
 *
 * @author Shinwa Solutions Team
 * @since 3.0.0
 */
@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    /**
     * 根据租户ID和合作伙伴ID查询
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @return 合作伙伴实体（可能为空）
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.id = :id AND p.deleted = false")
    Optional<Partner> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);

    /**
     * 根据合作伙伴编码查询
     *
     * @param partnerCode 合作伙伴编码
     * @return 合作伙伴实体（可能为空）
     */
    @Query("SELECT p FROM Partner p WHERE p.partnerCode = :partnerCode AND p.deleted = false")
    Optional<Partner> findByPartnerCode(@Param("partnerCode") String partnerCode);

    /**
     * 根据租户ID和编码查询
     *
     * @param tenantId    租户ID
     * @param partnerCode 合作伙伴编码
     * @return 合作伙伴实体（可能为空）
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.partnerCode = :partnerCode AND p.deleted = false")
    Optional<Partner> findByTenantIdAndPartnerCode(@Param("tenantId") String tenantId, @Param("partnerCode") String partnerCode);

    /**
     * 查询租户下的所有合作伙伴
     *
     * @param tenantId 租户ID
     * @return 合作伙伴列表
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.deleted = false ORDER BY p.createdAt DESC")
    List<Partner> findAllByTenantId(@Param("tenantId") String tenantId);

    /**
     * 根据类型查询合作伙伴
     *
     * @param tenantId    租户ID
     * @param partnerType 合作伙伴类型
     * @return 合作伙伴列表
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.partnerType = :partnerType AND p.deleted = false ORDER BY p.createdAt DESC")
    List<Partner> findByTenantIdAndPartnerType(@Param("tenantId") String tenantId, @Param("partnerType") PartnerType partnerType);

    /**
     * 根据状态查询合作伙伴
     *
     * @param tenantId 租户ID
     * @param status   合作伙伴状态
     * @return 合作伙伴列表
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.status = :status AND p.deleted = false ORDER BY p.createdAt DESC")
    List<Partner> findByTenantIdAndStatus(@Param("tenantId") String tenantId, @Param("status") PartnerStatus status);

    /**
     * 查询可用的合作伙伴（状态为 ACTIVE）
     *
     * @param tenantId 租户ID
     * @return 可用的合作伙伴列表
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.status = 'ACTIVE' AND p.deleted = false ORDER BY p.name")
    List<Partner> findAvailableByTenantId(@Param("tenantId") String tenantId);

    /**
     * 根据类型查询可用的合作伙伴
     *
     * @param tenantId    租户ID
     * @param partnerType 合作伙伴类型
     * @return 可用的合作伙伴列表
     */
    @Query("SELECT p FROM Partner p WHERE p.tenantId = :tenantId AND p.partnerType = :partnerType AND p.status = 'ACTIVE' AND p.deleted = false ORDER BY p.name")
    List<Partner> findAvailableByTenantIdAndType(@Param("tenantId") String tenantId, @Param("partnerType") PartnerType partnerType);

    /**
     * 检查合作伙伴编码是否已存在
     *
     * @param partnerCode 合作伙伴编码
     * @return 如果存在返回 true
     */
    boolean existsByPartnerCode(String partnerCode);

    /**
     * 统计租户下某类型的合作伙伴数量（用于生成编码）
     *
     * @param tenantId    租户ID
     * @param partnerType 合作伙伴类型
     * @return 数量
     */
    @Query("SELECT COUNT(p) FROM Partner p WHERE p.tenantId = :tenantId AND p.partnerType = :partnerType")
    long countByTenantIdAndPartnerType(@Param("tenantId") String tenantId, @Param("partnerType") PartnerType partnerType);
}
