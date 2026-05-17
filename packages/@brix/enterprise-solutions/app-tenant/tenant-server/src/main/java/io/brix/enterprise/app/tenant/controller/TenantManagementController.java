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
import io.brix.platform.auth.PlatformPermissions;
import io.brix.platform.auth.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tenant Management REST Controller.
 *
 * <p>Provides RESTful API endpoints for tenant lifecycle management,
 * including CRUD operations and member management.</p>
 *
 * <h3>API Version</h3>
 * <p>Current version: v1, path prefix: {@code /api/v1/tenants}</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "Tenants", description = "Tenant Management API - CRUD and member operations")
@RestController
@RequestMapping("/api/v1/tenants")
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
    @RequirePermission(PlatformPermissions.TENANT_MANAGE)
    @PostMapping
    public ResponseEntity<TenantDTO> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        TenantDTO tenant = tenantManagementService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tenant);
    }

    @Operation(summary = "Get tenant by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    @GetMapping("/{tenantId}")
    public ResponseEntity<TenantDTO> getTenant(
            @Parameter(description = "Tenant ID") @PathVariable Long tenantId) {
        return ResponseEntity.ok(tenantManagementService.getTenantById(tenantId));
    }

    @Operation(summary = "Get tenant by code")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    @GetMapping("/by-code/{code}")
    public ResponseEntity<TenantDTO> getTenantByCode(
            @Parameter(description = "Tenant code") @PathVariable String code) {
        return ResponseEntity.ok(tenantManagementService.getTenantByCode(code));
    }

    @Operation(summary = "List all tenants")
    @RequirePermission(PlatformPermissions.TENANT_VIEW)
    @GetMapping
    public ResponseEntity<List<TenantDTO>> listTenants() {
        return ResponseEntity.ok(tenantManagementService.listTenants());
    }

    @Operation(summary = "Activate a tenant")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant activated"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    @RequirePermission(PlatformPermissions.TENANT_MANAGE)
    @PostMapping("/{tenantId}/activate")
    public ResponseEntity<TenantDTO> activateTenant(
            @Parameter(description = "Tenant ID") @PathVariable Long tenantId) {
        return ResponseEntity.ok(tenantManagementService.activateTenant(tenantId));
    }

    @Operation(summary = "Suspend a tenant")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tenant suspended"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    @RequirePermission(PlatformPermissions.TENANT_MANAGE)
    @PostMapping("/{tenantId}/suspend")
    public ResponseEntity<TenantDTO> suspendTenant(
            @Parameter(description = "Tenant ID") @PathVariable Long tenantId) {
        return ResponseEntity.ok(tenantManagementService.suspendTenant(tenantId));
    }

    @Operation(summary = "List members of a tenant")
    @GetMapping("/{tenantId}/members")
    public ResponseEntity<List<TenantMemberDTO>> listMembers(
            @Parameter(description = "Tenant ID") @PathVariable Long tenantId) {
        return ResponseEntity.ok(tenantManagementService.listMembers(tenantId));
    }
}
