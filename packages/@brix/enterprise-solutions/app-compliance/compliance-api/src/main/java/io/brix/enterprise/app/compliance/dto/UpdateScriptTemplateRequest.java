/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * Request payload for updating an existing script template.
 *
 * <p>All fields are optional — only non-null fields will be applied.
 * The template status cannot be changed via this endpoint; use the
 * dedicated review/publish endpoints instead.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Schema(description = "Update script template request (partial update)")
public record UpdateScriptTemplateRequest(

        @Size(max = 200, message = "Template name must not exceed 200 characters")
        @Schema(description = "Display name")
        String name,

        @Schema(description = "Functional category")
        ScriptCategory category,

        @Schema(description = "Applicable communication scenario")
        ScriptScenario scenario,

        @Size(max = 10000, message = "Content must not exceed 10000 characters")
        @Schema(description = "Template content with {{variable}} placeholders")
        String content,

        @Schema(description = "Variable definitions")
        List<ScriptVariableDTO> variables,

        @Size(max = 2000, message = "Guidance must not exceed 2000 characters")
        @Schema(description = "Usage guidance for agents")
        String guidance,

        @Size(max = 1000, message = "Expected outcome must not exceed 1000 characters")
        @Schema(description = "Expected outcome description")
        String expectedOutcome,

        @Schema(description = "Search tags")
        List<String> tags,

        @Schema(description = "Associated product IDs")
        List<String> productIds

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
