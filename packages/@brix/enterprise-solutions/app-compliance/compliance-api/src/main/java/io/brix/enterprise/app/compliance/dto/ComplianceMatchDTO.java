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
import java.util.List;

/**
 * Single match result from a compliance check — represents one
 * occurrence of a forbidden word found in the checked content.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "A single forbidden-word match within checked content")
public record ComplianceMatchDTO(

        @Schema(description = "ID of the matched forbidden-word rule")
        String forbiddenWordId,

        @Schema(description = "The exact text that was matched", example = "guaranteed")
        String matchedText,

        @Schema(description = "Start index (0-based) within the checked content", example = "42")
        int startIndex,

        @Schema(description = "End index (exclusive) within the checked content", example = "52")
        int endIndex,

        @Schema(description = "Severity of the matched rule")
        ForbiddenWordSeverity severity,

        @Schema(description = "Category of the matched rule")
        ForbiddenWordCategory category,

        @Schema(description = "Reason why this word/phrase is forbidden")
        String reason,

        @Schema(description = "Suggested alternative expressions")
        List<String> alternatives

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
