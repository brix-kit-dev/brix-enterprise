/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * Request payload for creating a new forbidden word rule.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Schema(description = "Create forbidden word rule request")
public record CreateForbiddenWordRequest(

        @NotBlank(message = "Word or phrase is required")
        @Size(max = 500, message = "Word must not exceed 500 characters")
        @Schema(description = "The forbidden word or phrase", example = "guaranteed cure")
        String word,

        @NotNull(message = "Category is required")
        @Schema(description = "Violation category")
        ForbiddenWordCategory category,

        @NotNull(message = "Severity is required")
        @Schema(description = "Severity level")
        ForbiddenWordSeverity severity,

        @NotBlank(message = "Reason is required")
        @Size(max = 1000, message = "Reason must not exceed 1000 characters")
        @Schema(description = "Explanation of why this word/phrase is forbidden")
        String reason,

        @Schema(description = "Suggested alternative expressions")
        List<String> alternatives,

        @Schema(description = "Whether matching is case-sensitive (default: false)")
        Boolean caseSensitive,

        @Schema(description = "Whether to match whole words only (default: false)")
        Boolean wholeWordOnly,

        @Size(max = 1000, message = "Pattern must not exceed 1000 characters")
        @Schema(description = "Optional regex pattern for complex matching")
        String pattern,

        @Schema(description = "Whether this rule is active (default: true)")
        Boolean enabled

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
