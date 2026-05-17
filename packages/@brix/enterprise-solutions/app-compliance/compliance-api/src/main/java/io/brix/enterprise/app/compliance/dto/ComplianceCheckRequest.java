/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * Request payload for executing a compliance check against content.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Schema(description = "Compliance check execution request")
public record ComplianceCheckRequest(

        @NotBlank(message = "Content to check is required")
        @Size(max = 50000, message = "Content must not exceed 50000 characters")
        @Schema(description = "Content text to scan for forbidden words")
        String content,

        @Schema(description = "Type of the entity being checked (e.g. SCRIPT, CONTRACT)")
        String entityType,

        @Schema(description = "ID of the entity being checked")
        String entityId,

        @Schema(description = "Restrict check to specific categories (all categories if null/empty)")
        List<ForbiddenWordCategory> categories

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
