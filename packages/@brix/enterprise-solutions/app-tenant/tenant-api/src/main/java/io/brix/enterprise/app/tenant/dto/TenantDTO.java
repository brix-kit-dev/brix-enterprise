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
 * Data Transfer Object for tenant information.
 *
 * <p>Used to transfer tenant data between the service layer and presentation layer.
 * Contains all core attributes of a tenant for display and management purposes.</p>
 *
 * <h3>Usage Scenarios</h3>
 * <ul>
 *   <li>Tenant detail query response</li>
 *   <li>Tenant list query response</li>
 *   <li>Tenant creation/modification return value</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(name = "TenantDTO", description = "Tenant information data transfer object")
public class TenantDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Tenant unique identifier", example = "1001", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Tenant unique code (used in URLs and APIs)", example = "acme-corp")
    private String code;

    @Schema(description = "Tenant display name", example = "Acme Corporation")
    private String name;

    @Schema(description = "Tenant lifecycle status", example = "ACTIVE")
    private String status;

    @Schema(description = "Contact email address", example = "admin@acme.com")
    private String contactEmail;

    @Schema(description = "Creation timestamp", accessMode = Schema.AccessMode.READ_ONLY)
    private OffsetDateTime createdAt;

    @Schema(description = "Last update timestamp", accessMode = Schema.AccessMode.READ_ONLY)
    private OffsetDateTime updatedAt;

    public TenantDTO() {
    }

    public TenantDTO(Long id, String code, String name, String status,
                     String contactEmail, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.status = status;
        this.contactEmail = contactEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
