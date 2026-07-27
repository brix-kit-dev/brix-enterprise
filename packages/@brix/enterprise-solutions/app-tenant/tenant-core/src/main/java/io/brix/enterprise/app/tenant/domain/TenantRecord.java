/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * App-tenant owned tenant directory record.
 *
 * <p>This entity models the tenant directory owned by the app-tenant plugin.
 * It does not map platform-tenant internal tables and does not create
 * cross-plugin relationships.</p>
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@Entity
@Table(name = "app_tenant_record",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_app_tenant_record_code", columnNames = "code")
    },
    indexes = {
        @Index(name = "idx_app_tenant_record_status", columnList = "status"),
        @Index(name = "idx_app_tenant_record_owner", columnList = "owner_identity_id")
    })
public class TenantRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 64, updatable = false)
    private String code;

    @Column(name = "name", nullable = false, length = 256)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private TenantLifecycleStatus status = TenantLifecycleStatus.PENDING_ACTIVATION;

    @Column(name = "owner_identity_id", nullable = false)
    private Long ownerIdentityId;

    @Column(name = "contact_email", length = 320)
    private String contactEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "created_by_identity_id", nullable = false, updatable = false)
    private Long createdByIdentityId;

    @Column(name = "updated_by_identity_id", nullable = false)
    private Long updatedByIdentityId;

    /**
     * Creates an empty JPA entity.
     */
    protected TenantRecord() {
    }

    /**
     * Creates a tenant record.
     *
     * @param code tenant code
     * @param name tenant name
     * @param ownerIdentityId owner identity id
     * @param contactEmail contact email
     */
    public TenantRecord(String code, String name, Long ownerIdentityId, String contactEmail) {
        this.code = code;
        this.name = name;
        this.ownerIdentityId = ownerIdentityId;
        this.contactEmail = contactEmail;
        this.createdByIdentityId = ownerIdentityId;
        this.updatedByIdentityId = ownerIdentityId;
    }

    /**
     * Marks this tenant active.
     */
    public void activate() {
        this.status = TenantLifecycleStatus.ACTIVE;
        this.updatedByIdentityId = ownerIdentityId;
    }

    /**
     * Marks this tenant suspended.
     */
    public void suspend() {
        this.status = TenantLifecycleStatus.SUSPENDED;
        this.updatedByIdentityId = ownerIdentityId;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public TenantLifecycleStatus getStatus() {
        return status;
    }

    public Long getOwnerIdentityId() {
        return ownerIdentityId;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
