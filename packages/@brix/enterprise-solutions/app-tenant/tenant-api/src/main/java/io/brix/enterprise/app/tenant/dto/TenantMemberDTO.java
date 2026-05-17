/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for tenant member information.
 *
 * <p>Represents the membership association between an identity (user)
 * and a tenant, including role and status information.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(name = "TenantMemberDTO", description = "Tenant member information data transfer object")
public class TenantMemberDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Membership unique identifier", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Tenant ID this membership belongs to")
    private Long tenantId;

    @Schema(description = "Identity (user) ID")
    private Long identityId;

    @Schema(description = "Display name of the member")
    private String displayName;

    @Schema(description = "Email address of the member")
    private String email;

    @Schema(description = "Member type/role: OWNER, ADMIN, MEMBER, GUEST", example = "MEMBER")
    private String memberType;

    @Schema(description = "Membership status: ACTIVE, SUSPENDED", example = "ACTIVE")
    private String status;

    @Schema(description = "When the member joined", accessMode = Schema.AccessMode.READ_ONLY)
    private OffsetDateTime joinedAt;

    public TenantMemberDTO() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getIdentityId() { return identityId; }
    public void setIdentityId(Long identityId) { this.identityId = identityId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMemberType() { return memberType; }
    public void setMemberType(String memberType) { this.memberType = memberType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }
}
