/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * App-tenant owned tenant membership record.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@Entity
@Table(name = "app_tenant_member",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_app_tenant_member_identity", columnNames = {"tenant_id", "identity_id"})
    },
    indexes = {
        @Index(name = "idx_app_tenant_member_tenant", columnList = "tenant_id"),
        @Index(name = "idx_app_tenant_member_identity", columnList = "identity_id")
    })
public class TenantMemberRecord {

    /**
     * Active tenant membership status.
     */
    public static final String STATUS_ACTIVE = "ACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "identity_id", nullable = false)
    private Long identityId;

    @Column(name = "display_name", length = 256)
    private String displayName;

    @Column(name = "email", length = 320)
    private String email;

    @Column(name = "member_type", nullable = false, length = 32)
    private String memberType;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    /**
     * Creates an empty JPA entity.
     */
    protected TenantMemberRecord() {
    }

    /**
     * Creates a member record.
     *
     * @param tenantId tenant id
     * @param identityId identity id
     * @param displayName display name
     * @param email email
     * @param memberType member type
     */
    public TenantMemberRecord(
            Long tenantId,
            Long identityId,
            String displayName,
            String email,
            String memberType) {
        this.tenantId = tenantId;
        this.identityId = identityId;
        this.displayName = displayName;
        this.email = email;
        this.memberType = memberType;
        this.status = STATUS_ACTIVE;
    }

    @PrePersist
    void onCreate() {
        this.joinedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public Long getIdentityId() {
        return identityId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getMemberType() {
        return memberType;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getJoinedAt() {
        return joinedAt;
    }
}
