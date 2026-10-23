/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Read-only JPA entity mapping for the {@code auth_role_permission} join table.
 *
 * <p>Used by {@link io.brix.enterprise.app.identity.repository.RbacRepository}
 * for JPQL joins when loading user permissions during JWT issuance.
 * Table schema is owned by platform-auth's Flyway migration.</p>
 *
 * @author Brix Platform Team
 * @since 3.1.0
 */
@Entity
@Table(name = "auth_role_permission")
public class AuthRolePermission {

    @Id
    @Column(name = "id", length = 128)
    private String id;

    @Column(name = "role_id", length = 64, nullable = false)
    private String roleId;

    @Column(name = "permission_id", length = 64, nullable = false)
    private String permissionId;

    /** Data scope type: ALL, DEPARTMENT, SELF, CUSTOM. */
    @Column(name = "data_scope", length = 32)
    private String dataScope;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ==================== Getters ====================

    public String getId() { return id; }
    public String getRoleId() { return roleId; }
    public String getPermissionId() { return permissionId; }
    public String getDataScope() { return dataScope; }
    public String getTenantId() { return tenantId; }
    public boolean isDeleted() { return deleted; }
}
