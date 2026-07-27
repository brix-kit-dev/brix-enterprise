/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.controller;

import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.dto.TenantMemberDTO;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;
import io.brix.enterprise.app.tenant.service.TenantManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

/**
 * Legacy tenant management HTTP adapter.
 *
 * <p>Runtime Shell v3.0.10 publishes tenant endpoints through manifest routes,
 * handler bindings, and the L2B dispatcher. This class is intentionally not a
 * Spring MVC controller and is not component-scanned by
 * {@code TenantAutoConfiguration}.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "Tenants", description = "Tenant Management API - CRUD and member operations")
public class TenantManagementController {

    private final TenantManagementService tenantManagementService;

    public TenantManagementController(TenantManagementService tenantManagementService) {
        this.tenantManagementService = tenantManagementService;
    }

    @Operation(summary = "Create a new tenant")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tenant created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "409", description = "Tenant code already exists")
    })
    public TenantDTO createTenant(CreateTenantRequest request) {
        return tenantManagementService.createTenant(request);
    }

    @Operation(summary = "Get tenant by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public TenantDTO getTenant(
            @Parameter(description = "Tenant ID") Long tenantId) {
        return tenantManagementService.getTenantById(tenantId);
    }

    @Operation(summary = "Get tenant by code")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public TenantDTO getTenantByCode(
            @Parameter(description = "Tenant code") String code) {
        return tenantManagementService.getTenantByCode(code);
    }

    @Operation(summary = "List all tenants")
    public List<TenantDTO> listTenants() {
        return tenantManagementService.listTenants();
    }

    @Operation(summary = "Activate a tenant")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant activated"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public TenantDTO activateTenant(
            @Parameter(description = "Tenant ID") Long tenantId) {
        return tenantManagementService.activateTenant(tenantId);
    }

    @Operation(summary = "Suspend a tenant")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant suspended"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public TenantDTO suspendTenant(
            @Parameter(description = "Tenant ID") Long tenantId) {
        return tenantManagementService.suspendTenant(tenantId);
    }

    @Operation(summary = "List members of a tenant")
    public List<TenantMemberDTO> listMembers(
            @Parameter(description = "Tenant ID") Long tenantId) {
        return tenantManagementService.listMembers(tenantId);
    }
}
