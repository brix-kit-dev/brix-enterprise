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
package io.brix.enterprise.app.casemanagement.core.repository;

import io.brix.enterprise.app.casemanagement.core.entity.CaseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Case Data Repository
 * 
 * <p>Provides data access operations for Case entities.</p>
 * 
 * <p><b>v3.0 Architecture Notes:</b></p>
 * <ul>
 *   <li>Extends JpaRepository to get standard CRUD operations</li>
 *   <li>Custom query methods follow Spring Data naming conventions</li>
 *   <li>Multi-tenant filtering is automatically handled by Hibernate Filter</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Repository
public interface CaseRepository extends JpaRepository<CaseEntity, String> {

    /**
     * Finds by tenant ID and name.
     * 
     * @param tenantId tenant ID
     * @param name name
     * @return entity (optional)
     */
    Optional<CaseEntity> findByTenantIdAndName(String tenantId, String name);

    /**
     * Finds by ID within a tenant boundary.
     *
     * @param id record ID
     * @param tenantId tenant ID
     * @return entity (optional)
     */
    Optional<CaseEntity> findByIdAndTenantId(String id, String tenantId);

    /**
     * Finds all records by tenant ID.
     * 
     * @param tenantId tenant ID
     * @return entity list
     */
    List<CaseEntity> findByTenantId(String tenantId);

    /**
     * Finds by tenant ID with pagination.
     * 
     * @param tenantId tenant ID
     * @param pageable pagination parameters
     * @return paginated results
     */
    Page<CaseEntity> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Finds records created by the current subject within a tenant.
     *
     * @param tenantId tenant ID
     * @param createdBy creator ID
     * @param pageable pagination parameters
     * @return paginated results
     */
    Page<CaseEntity> findByTenantIdAndCreatedBy(String tenantId, String createdBy, Pageable pageable);

    /**
     * Finds by tenant ID and status.
     * 
     * @param tenantId tenant ID
     * @param status status
     * @return entity list
     */
    List<CaseEntity> findByTenantIdAndStatus(String tenantId, String status);

    /**
     * Searches by tenant ID and name (fuzzy match).
     * 
     * @param tenantId tenant ID
     * @param keyword search keyword
     * @param pageable pagination parameters
     * @return paginated results
     */
    @Query("SELECT e FROM CaseEntity e WHERE e.tenantId = :tenantId AND e.name LIKE %:keyword%")
    Page<CaseEntity> searchByName(
        @Param("tenantId") String tenantId,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    /**
     * Searches records created by the current subject within a tenant.
     *
     * @param tenantId tenant ID
     * @param createdBy creator ID
     * @param keyword search keyword
     * @param pageable pagination parameters
     * @return paginated results
     */
    @Query("SELECT e FROM CaseEntity e WHERE e.tenantId = :tenantId AND e.createdBy = :createdBy AND e.name LIKE %:keyword%")
    Page<CaseEntity> searchByNameForCreator(
        @Param("tenantId") String tenantId,
        @Param("createdBy") String createdBy,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    /**
     * Checks if name already exists within the same tenant.
     * 
     * @param tenantId tenant ID
     * @param name name
     * @return whether exists
     */
    boolean existsByTenantIdAndName(String tenantId, String name);
}
