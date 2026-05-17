/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Read-only JPA entity mapping for the {@code auth_role} table.
 *
 * <p>Used by {@link io.brix.enterprise.app.identity.repository.RbacRepository}
 * for JPQL joins when loading user permissions during JWT issuance.
 * Table schema is owned by platform-auth's Flyway migration.</p>
 *
 * @author Brix Platform Team
 * @since 3.1.0
 */
@Entity
@Table(name = "auth_role")
public class AuthRole {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** Role code (e.g., "ADMIN", "OPERATOR"), unique per tenant. */
    @Column(name = "code", length = 100, nullable = false)
    private String code;

    /** Human-readable role name. */
    @Column(name = "name", length = 100, nullable = false)
    private String name;

    /** Role type: SYSTEM or CUSTOM. */
    @Column(name = "type", length = 32, nullable = false)
    private String type;

    /** Role status: ACTIVE or INACTIVE. */
    @Column(name = "status", length = 32, nullable = false)
    private String status;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ==================== Getters ====================

    public String getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getTenantId() { return tenantId; }
    public boolean isDeleted() { return deleted; }
}
