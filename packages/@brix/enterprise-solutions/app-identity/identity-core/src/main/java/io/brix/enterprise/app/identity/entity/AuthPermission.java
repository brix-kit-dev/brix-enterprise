/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Read-only JPA entity mapping for the {@code auth_permission} table.
 *
 * <p>Used by {@link io.brix.enterprise.app.identity.repository.RbacRepository}
 * for JPQL joins when loading user permissions during JWT issuance.
 * Table schema is owned by platform-auth's Flyway migration.</p>
 *
 * @author Brix Platform Team
 * @since 3.1.0
 */
@Entity
@Table(name = "auth_permission")
public class AuthPermission {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** Permission code (e.g., "booking:read", "booking:write"), unique per tenant. */
    @Column(name = "code", length = 200, nullable = false)
    private String code;

    /** Human-readable permission name. */
    @Column(name = "name", length = 100, nullable = false)
    private String name;

    /** Module this permission belongs to (e.g., "booking", "identity"). */
    @Column(name = "module", length = 100, nullable = false)
    private String module;

    /** Permission type: MENU, BUTTON, API, DATA. */
    @Column(name = "type", length = 32, nullable = false)
    private String type;

    /** Permission status: ACTIVE or INACTIVE. */
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
    public String getModule() { return module; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getTenantId() { return tenantId; }
    public boolean isDeleted() { return deleted; }
}
