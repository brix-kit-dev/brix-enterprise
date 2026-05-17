/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.repository;

import io.brix.enterprise.app.identity.entity.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for reading RBAC role/permission assignments.
 *
 * <p>Provides read-only access to the RBAC join tables (auth_user_role,
 * auth_role_permission, auth_permission) for loading user permissions
 * during JWT token issuance.</p>
 *
 * <h3>Table Ownership</h3>
 * <p>All RBAC tables are owned by platform-auth (Layer 2C) and created by
 * {@code V1__create_auth_tables.sql}. This repository only performs read
 * operations — no INSERT/UPDATE/DELETE.</p>
 *
 * <h3>Multi-Tenant Isolation</h3>
 * <p>All queries include {@code tenant_id} filter to enforce strict tenant
 * isolation per v3.0.9 Blueprint Section 14 security red line.</p>
 *
 * @author Brix Platform Team
 * @since 3.1.0
 */
@Repository
public interface RbacRepository extends JpaRepository<UserRoleAssignment, String> {

    /**
     * Loads all active role codes assigned to a user within a tenant.
     *
     * <p>Joins {@code auth_user_role → auth_role} to resolve role codes.
     * Only returns roles where:</p>
     * <ul>
     *   <li>The user-role assignment is not soft-deleted</li>
     *   <li>The role itself is not soft-deleted and has ACTIVE status</li>
     *   <li>The validity window is either null or covers the current time</li>
     * </ul>
     *
     * @param userId   the user ID
     * @param tenantId the tenant ID for isolation
     * @return list of role code strings (e.g., ["ADMIN", "OPERATOR"])
     */
    @Query("SELECT r.code FROM UserRoleAssignment ura " +
           "JOIN AuthRole r ON r.id = ura.roleId " +
           "WHERE ura.userId = :userId " +
           "AND ura.tenantId = :tenantId " +
           "AND ura.deleted = false " +
           "AND r.deleted = false " +
           "AND r.status = 'ACTIVE' " +
           "AND (ura.validFrom IS NULL OR ura.validFrom <= CURRENT_TIMESTAMP) " +
           "AND (ura.validUntil IS NULL OR ura.validUntil >= CURRENT_TIMESTAMP)")
    List<String> findActiveRoleCodesByUserIdAndTenantId(
            @Param("userId") String userId,
            @Param("tenantId") String tenantId);

    /**
     * Loads all active permission codes assigned to a user within a tenant.
     *
     * <p>Performs a three-table join: {@code auth_user_role → auth_role_permission
     * → auth_permission} to resolve the full set of permission codes for a user.
     * Only returns permissions where all intermediate records are active and
     * non-deleted.</p>
     *
     * <p>Results are de-duplicated via {@code DISTINCT} since a user may hold
     * multiple roles that grant the same permission.</p>
     *
     * @param userId   the user ID
     * @param tenantId the tenant ID for isolation
     * @return list of unique permission code strings (e.g., ["booking:read", "booking:write"])
     */
    @Query("SELECT DISTINCT p.code FROM UserRoleAssignment ura " +
           "JOIN AuthRole r ON r.id = ura.roleId " +
           "JOIN AuthRolePermission rp ON rp.roleId = r.id " +
           "JOIN AuthPermission p ON p.id = rp.permissionId " +
           "WHERE ura.userId = :userId " +
           "AND ura.tenantId = :tenantId " +
           "AND ura.deleted = false " +
           "AND r.deleted = false " +
           "AND r.status = 'ACTIVE' " +
           "AND rp.deleted = false " +
           "AND p.deleted = false " +
           "AND p.status = 'ACTIVE' " +
           "AND (ura.validFrom IS NULL OR ura.validFrom <= CURRENT_TIMESTAMP) " +
           "AND (ura.validUntil IS NULL OR ura.validUntil >= CURRENT_TIMESTAMP)")
    List<String> findActivePermissionCodesByUserIdAndTenantId(
            @Param("userId") String userId,
            @Param("tenantId") String tenantId);
}
