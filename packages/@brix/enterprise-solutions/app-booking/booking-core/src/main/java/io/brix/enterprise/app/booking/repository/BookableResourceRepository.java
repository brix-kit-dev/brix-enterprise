/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.repository;

import io.brix.enterprise.app.booking.entity.BookableResource;
import io.brix.enterprise.app.booking.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 可预约资源仓库接口
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Repository
public interface BookableResourceRepository extends JpaRepository<BookableResource, Long> {
    
    /**
     * 根据ID和租户ID查询资源
     *
     * @param id       资源ID
     * @param tenantId 租户ID
     * @return 资源实体
     */
    Optional<BookableResource> findByIdAndTenantId(Long id, Long tenantId);
    
    /**
     * 根据资源类型和外部资源ID查询
     *
     * @param resourceType       资源类型
     * @param externalResourceId 外部资源ID
     * @param tenantId           租户ID
     * @return 资源实体
     */
    Optional<BookableResource> findByResourceTypeAndExternalResourceIdAndTenantId(
            ResourceType resourceType, Long externalResourceId, Long tenantId);
    
    /**
     * 查询租户下所有启用的资源
     *
     * @param tenantId 租户ID
     * @param enabled  是否启用
     * @return 资源列表
     */
    List<BookableResource> findByTenantIdAndEnabled(Long tenantId, Boolean enabled);
    
    /**
     * 按资源类型查询
     *
     * @param resourceType 资源类型
     * @param tenantId     租户ID
     * @param enabled      是否启用
     * @return 资源列表
     */
    List<BookableResource> findByResourceTypeAndTenantIdAndEnabled(
            ResourceType resourceType, Long tenantId, Boolean enabled);
}
