/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * Request payload for creating a new script template.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Schema(description = "Create script template request")
public record CreateScriptTemplateRequest(

        @NotBlank(message = "Template code is required")
        @Size(max = 50, message = "Template code must not exceed 50 characters")
        @Schema(description = "Unique business code", example = "TPL-OPEN-001")
        String code,

        @NotBlank(message = "Template name is required")
        @Size(max = 200, message = "Template name must not exceed 200 characters")
        @Schema(description = "Display name", example = "Standard Opening Greeting")
        String name,

        @NotNull(message = "Category is required")
        @Schema(description = "Functional category")
        ScriptCategory category,

        @NotNull(message = "Scenario is required")
        @Schema(description = "Applicable communication scenario")
        ScriptScenario scenario,

        @NotBlank(message = "Content is required")
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
