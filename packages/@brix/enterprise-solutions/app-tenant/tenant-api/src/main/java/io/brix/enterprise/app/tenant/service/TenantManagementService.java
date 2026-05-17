/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.service;

import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.dto.TenantMemberDTO;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;

import java.util.List;

/**
 * Tenant Management Service interface.
 *
 * <p>Defines all business operations for tenant lifecycle management,
 * including creation, query, status changes, and member management.</p>
 *
 * <h3>Transaction Semantics</h3>
 * <p>All write operations must execute within a transaction to ensure
 * data consistency across the tenant and related entities.</p>
 *
 * <h3>Multi-Tenancy</h3>
 * <p>This service operates at the platform level — queries are NOT
 * filtered by current tenant context as this manages tenants themselves.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface TenantManagementService {

    /**
     * Creates a new tenant with the provided information.
     *
     * @param request the tenant creation request
     * @return the created tenant DTO
     */
    TenantDTO createTenant(CreateTenantRequest request);

    /**
     * Retrieves a tenant by its unique ID.
     *
     * @param tenantId the tenant ID
     * @return the tenant DTO
     * @throws jakarta.persistence.EntityNotFoundException if tenant not found
     */
    TenantDTO getTenantById(Long tenantId);

    /**
     * Retrieves a tenant by its unique code.
     *
     * @param code the tenant code
     * @return the tenant DTO
     * @throws jakarta.persistence.EntityNotFoundException if tenant not found
     */
    TenantDTO getTenantByCode(String code);

    /**
     * Lists all tenants in the system.
     *
     * @return list of all tenant DTOs
     */
    List<TenantDTO> listTenants();

    /**
     * Activates a tenant (transitions from PENDING_ACTIVATION to ACTIVE).
     *
     * @param tenantId the tenant ID to activate
     * @return the updated tenant DTO
     */
    TenantDTO activateTenant(Long tenantId);

    /**
     * Suspends a tenant (transitions from ACTIVE to SUSPENDED).
     *
     * @param tenantId the tenant ID to suspend
     * @return the updated tenant DTO
     */
    TenantDTO suspendTenant(Long tenantId);

    /**
     * Lists members of a specific tenant.
     *
     * @param tenantId the tenant ID
     * @return list of tenant member DTOs
     */
    List<TenantMemberDTO> listMembers(Long tenantId);
}
