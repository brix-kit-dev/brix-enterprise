package com.shinwa.app.contracts.repository;

import com.shinwa.app.contracts.entity.ContractTemplate;
import com.shinwa.app.contracts.entity.TemplateVersion;
import com.shinwa.app.contracts.enums.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 合同模板仓储接口
 *
 * <p>提供合同模板实体的数据访问操作，所有查询自动过滤已删除数据。
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@Repository
public interface ContractTemplateRepository extends JpaRepository<ContractTemplate, Long> {

    /**
     * 按租户和ID查询模板
     *
     * @param id       模板ID
     * @param tenantId 租户ID
     * @return 模板实体
     */
    @Query("SELECT t FROM ContractTemplate t WHERE t.id = :id AND t.tenantId = :tenantId AND t.deleted = false")
    Optional<ContractTemplate> findByIdAndTenantId(@Param("id") Long id, 
                                                   @Param("tenantId") String tenantId);

    /**
     * 按模板编码查询
     *
     * @param templateCode 模板编码
     * @param tenantId     租户ID
     * @return 模板实体
     */
    @Query("SELECT t FROM ContractTemplate t WHERE t.templateCode = :templateCode AND t.tenantId = :tenantId AND t.deleted = false")
    Optional<ContractTemplate> findByCodeAndTenantId(@Param("templateCode") String templateCode, 
                                                     @Param("tenantId") String tenantId);

    /**
     * 查询所有模板
     *
     * @param tenantId 租户ID
     * @return 模板列表
     */
    @Query("SELECT t FROM ContractTemplate t WHERE t.tenantId = :tenantId AND t.deleted = false ORDER BY t.createdAt DESC")
    List<ContractTemplate> findAllByTenantId(@Param("tenantId") String tenantId);

    /**
     * 查询启用的模板
     *
     * @param tenantId 租户ID
     * @return 模板列表
     */
    @Query("SELECT t FROM ContractTemplate t WHERE t.tenantId = :tenantId AND t.isActive = true AND t.deleted = false ORDER BY t.createdAt DESC")
    List<ContractTemplate> findActiveByTenantId(@Param("tenantId") String tenantId);

    /**
     * 按合同类型查询模板
     *
     * @param contractType 合同类型
     * @param tenantId     租户ID
     * @return 模板列表
     */
    @Query("SELECT t FROM ContractTemplate t WHERE t.contractType = :contractType AND t.tenantId = :tenantId AND t.isActive = true AND t.deleted = false ORDER BY t.createdAt DESC")
    List<ContractTemplate> findByTypeAndTenantId(@Param("contractType") ContractType contractType, 
                                                 @Param("tenantId") String tenantId);

    /**
     * 检查模板编码是否存在
     *
     * @param templateCode 模板编码
     * @param tenantId     租户ID
     * @return 是否存在
     */
    @Query("SELECT COUNT(t) > 0 FROM ContractTemplate t WHERE t.templateCode = :templateCode AND t.tenantId = :tenantId AND t.deleted = false")
    boolean existsByCodeAndTenantId(@Param("templateCode") String templateCode, 
                                    @Param("tenantId") String tenantId);

    /**
     * 统计模板数量
     *
     * @param tenantId   租户ID
     * @param activeOnly 是否只统计启用的
     * @return 数量
     */
    @Query("SELECT COUNT(t) FROM ContractTemplate t WHERE t.tenantId = :tenantId AND t.deleted = false " +
           "AND (:activeOnly = false OR t.isActive = true)")
    long countByTenantId(@Param("tenantId") String tenantId, 
                         @Param("activeOnly") boolean activeOnly);

    /**
     * 检查模板是否被使用
     *
     * @param templateId 模板ID
     * @return 是否被使用
     */
    @Query("SELECT COUNT(c) > 0 FROM Contract c WHERE c.templateId = :templateId AND c.deleted = false")
    boolean isTemplateInUse(@Param("templateId") Long templateId);

    /**
     * 查询模板的指定版本
     *
     * @param templateId    模板ID
     * @param versionNumber 版本号
     * @return 版本实体
     */
    @Query("SELECT v FROM TemplateVersion v WHERE v.template.id = :templateId AND v.versionNumber = :versionNumber")
    Optional<TemplateVersion> findVersionByTemplateAndVersion(@Param("templateId") Long templateId, 
                                                              @Param("versionNumber") Integer versionNumber);

    /**
     * 查询模板的所有版本
     *
     * @param templateId 模板ID
     * @return 版本列表
     */
    @Query("SELECT v FROM TemplateVersion v WHERE v.template.id = :templateId ORDER BY v.versionNumber DESC")
    List<TemplateVersion> findVersionsByTemplateId(@Param("templateId") Long templateId);
}
