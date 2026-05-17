/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * Request object for creating a new tenant.
 *
 * <p>Contains the minimum required information to provision a new tenant
 * in the system, including the owner identity reference.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(name = "CreateTenantRequest", description = "Request payload for tenant creation")
public class CreateTenantRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Tenant code is required")
    @Size(min = 2, max = 64, message = "Tenant code must be between 2 and 64 characters")
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant code must be lowercase alphanumeric with hyphens")
    @Schema(description = "Unique tenant code for URLs and APIs", example = "acme-corp")
    private String code;

    @NotBlank(message = "Tenant name is required")
    @Size(min = 1, max = 256, message = "Tenant name must be between 1 and 256 characters")
    @Schema(description = "Human-readable display name", example = "Acme Corporation")
    private String name;

    @NotNull(message = "Owner identity ID is required")
    @Schema(description = "Identity ID of the tenant owner", example = "1001")
    private Long ownerIdentityId;

    @Schema(description = "Contact email for the tenant", example = "admin@acme.com")
    private String contactEmail;

    public CreateTenantRequest() {
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getOwnerIdentityId() { return ownerIdentityId; }
    public void setOwnerIdentityId(Long ownerIdentityId) { this.ownerIdentityId = ownerIdentityId; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
}
