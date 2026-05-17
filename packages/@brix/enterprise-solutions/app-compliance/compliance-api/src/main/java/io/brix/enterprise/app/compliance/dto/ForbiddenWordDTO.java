/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data transfer object representing a forbidden word or phrase rule.
 *
 * <p>Forbidden words are matched against agent-generated content during
 * compliance checks. A rule can match by exact word, whole-word boundary,
 * or a custom regex pattern.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Forbidden word/phrase compliance rule")
public record ForbiddenWordDTO(

        @Schema(description = "Unique identifier (UUID)")
        String id,

        @Schema(description = "The forbidden word or phrase", example = "guaranteed cure")
        String word,

        @Schema(description = "Violation category")
        ForbiddenWordCategory category,

        @Schema(description = "Severity level")
        ForbiddenWordSeverity severity,

        @Schema(description = "Explanation of why this word/phrase is forbidden")
        String reason,

        @Schema(description = "Suggested alternative expressions for agents")
        List<String> alternatives,

        @Schema(description = "Whether matching is case-sensitive", example = "false")
        Boolean caseSensitive,

        @Schema(description = "Whether to match whole words only", example = "true")
        Boolean wholeWordOnly,

        @Schema(description = "Optional regex pattern for complex matching rules")
        String pattern,

        @Schema(description = "Whether this rule is currently active", example = "true")
        Boolean enabled,

        @Schema(description = "User ID of the creator")
        String createdBy,

        @Schema(description = "Creation timestamp")
        LocalDateTime createdAt,

        @Schema(description = "User ID of the last updater")
        String updatedBy,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
