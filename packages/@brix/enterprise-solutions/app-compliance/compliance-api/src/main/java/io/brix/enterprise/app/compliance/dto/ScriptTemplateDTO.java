/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data transfer object representing a script template.
 *
 * <p>Script templates are pre-approved conversation scripts that
 * call-centre agents use during customer interactions. Each template
 * supports variable placeholders (e.g. {@code {{customerName}}}) which
 * agents fill in before sending.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Script template for agent conversations")
public record ScriptTemplateDTO(

        @Schema(description = "Unique identifier (UUID)")
        String id,

        @Schema(description = "Template code — unique business key", example = "TPL-OPEN-001")
        String code,

        @Schema(description = "Template display name", example = "Standard Opening Greeting")
        String name,

        @Schema(description = "Functional category")
        ScriptCategory category,

        @Schema(description = "Applicable communication scenario")
        ScriptScenario scenario,

        @Schema(description = "Template content with {{variable}} placeholders")
        String content,

        @Schema(description = "Variable definitions for dynamic placeholders")
        List<ScriptVariableDTO> variables,

        @Schema(description = "Usage guidance for agents")
        String guidance,

        @Schema(description = "Expected outcome description")
        String expectedOutcome,

        @Schema(description = "Lifecycle status")
        ScriptTemplateStatus status,

        @Schema(description = "Semantic version of this template", example = "1.0.0")
        String version,

        @Schema(description = "Search tags")
        List<String> tags,

        @Schema(description = "Associated product IDs")
        List<String> productIds,

        @Schema(description = "Number of times this template has been used", example = "42")
        Long usageCount,

        @Schema(description = "Average effectiveness rating (0-5)", example = "4.2")
        Double effectivenessRating,

        @Schema(description = "Review comments from compliance officer")
        String reviewComments,

        @Schema(description = "User ID of the creator")
        String createdBy,

        @Schema(description = "Creation timestamp")
        LocalDateTime createdAt,

        @Schema(description = "User ID of the last updater")
        String updatedBy,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt,

        @Schema(description = "User ID of the reviewer")
        String reviewedBy,

        @Schema(description = "Review timestamp")
        LocalDateTime reviewedAt

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
