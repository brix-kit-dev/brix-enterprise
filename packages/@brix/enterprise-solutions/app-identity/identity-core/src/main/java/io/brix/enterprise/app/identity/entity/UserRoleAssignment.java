/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * JPA entity mapping for the {@code auth_user_role} join table.
 *
 * <p>Provides read access to user-role assignments stored in the RBAC schema
 * defined by platform-auth's Flyway migration ({@code V1__create_auth_tables.sql}).
 * This entity is used solely for permission loading during JWT issuance — it does
 * NOT own the table schema.</p>
 *
 * <h3>Architecture Compliance</h3>
 * <ul>
 *   <li><b>Table ownership</b>: DDL is owned by platform-auth (Layer 2C)</li>
 *   <li><b>Read access</b>: identity-core reads RBAC data for JWT claim population</li>
 *   <li><b>Multi-tenant</b>: All queries must include {@code tenant_id} filter</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.1.0
 * @see UserRole
 */
@Entity
@Table(name = "auth_user_role", indexes = {
        @Index(name = "idx_auth_user_role_user", columnList = "user_id"),
        @Index(name = "idx_auth_user_role_role", columnList = "role_id"),
        @Index(name = "idx_auth_user_role_tenant", columnList = "tenant_id")
})
public class UserRoleAssignment {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    @Column(name = "role_id", length = 64, nullable = false)
    private String roleId;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ==================== Getters ====================

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getRoleId() { return roleId; }
    public LocalDateTime getValidFrom() { return validFrom; }
    public LocalDateTime getValidUntil() { return validUntil; }
    public String getTenantId() { return tenantId; }
    public boolean isDeleted() { return deleted; }

    /**
     * Checks whether this role assignment is currently active.
     *
     * <p>An assignment is active when it is not soft-deleted and the current
     * time falls within the optional validity window [{@code validFrom}, {@code validUntil}].</p>
     *
     * @return {@code true} if this assignment is active
     */
    public boolean isActive() {
        if (deleted) return false;
        LocalDateTime now = LocalDateTime.now();
        if (validFrom != null && now.isBefore(validFrom)) return false;
        if (validUntil != null && now.isAfter(validUntil)) return false;
        return true;
    }
}
