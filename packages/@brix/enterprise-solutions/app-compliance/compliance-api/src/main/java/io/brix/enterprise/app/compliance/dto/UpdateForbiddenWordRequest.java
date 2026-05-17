/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * Request payload for updating an existing forbidden word rule.
 *
 * <p>All fields are optional — only non-null fields will be applied.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Schema(description = "Update forbidden word rule request (partial update)")
public record UpdateForbiddenWordRequest(

        @Size(max = 500, message = "Word must not exceed 500 characters")
        @Schema(description = "The forbidden word or phrase")
        String word,

        @Schema(description = "Violation category")
        ForbiddenWordCategory category,

        @Schema(description = "Severity level")
        ForbiddenWordSeverity severity,

        @Size(max = 1000, message = "Reason must not exceed 1000 characters")
        @Schema(description = "Explanation of why this word/phrase is forbidden")
        String reason,

        @Schema(description = "Suggested alternative expressions")
        List<String> alternatives,

        @Schema(description = "Whether matching is case-sensitive")
        Boolean caseSensitive,

        @Schema(description = "Whether to match whole words only")
        Boolean wholeWordOnly,

        @Size(max = 1000, message = "Pattern must not exceed 1000 characters")
        @Schema(description = "Optional regex pattern for complex matching")
        String pattern,

        @Schema(description = "Whether this rule is active")
        Boolean enabled

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
