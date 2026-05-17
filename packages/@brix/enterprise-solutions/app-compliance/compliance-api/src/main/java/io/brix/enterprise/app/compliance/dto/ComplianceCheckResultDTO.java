/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.brix.enterprise.app.compliance.enums.ComplianceCheckStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data transfer object for the result of a compliance check execution.
 *
 * <p>A compliance check scans a piece of content against all active
 * forbidden-word rules and produces a summary with individual matches.
 * The overall {@link #status()} is determined by the highest severity
 * match found.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Result of a compliance check execution")
public record ComplianceCheckResultDTO(

        @Schema(description = "Unique identifier (UUID)")
        String id,

        @Schema(description = "The content that was checked")
        String content,

        @Schema(description = "Overall check status (PASS / WARNING / FAIL)")
        ComplianceCheckStatus status,

        @Schema(description = "Total number of issues found", example = "3")
        int issueCount,

        @Schema(description = "Number of CRITICAL severity matches", example = "0")
        int criticalCount,

        @Schema(description = "Number of HIGH severity matches", example = "1")
        int highCount,

        @Schema(description = "Number of MEDIUM severity matches", example = "1")
        int mediumCount,

        @Schema(description = "Number of LOW severity matches", example = "1")
        int lowCount,

        @Schema(description = "Detailed match results")
        List<ComplianceMatchDTO> matches,

        @Schema(description = "Timestamp of the check execution")
        LocalDateTime checkedAt,

        @Schema(description = "User ID who triggered the check (null if automated)")
        String checkedBy,

        @Schema(description = "Type of the entity being checked (e.g. SCRIPT, CONTRACT)")
        String entityType,

        @Schema(description = "ID of the entity being checked")
        String entityId

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
