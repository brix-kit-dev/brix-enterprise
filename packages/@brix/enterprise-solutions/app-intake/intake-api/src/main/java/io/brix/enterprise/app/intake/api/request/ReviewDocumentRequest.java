/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for reviewing a submitted document.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Review Document Request")
public class ReviewDocumentRequest {

    /**
     * Checklist item ID.
     */
    @NotNull(message = "Item ID is required")
    @Schema(description = "Checklist item ID", example = "10001")
    private Long itemId;

    /**
     * Review decision.
     */
    @NotBlank(message = "Decision is required")
    @Schema(description = "Review decision", example = "APPROVED")
    private String decision;

    /**
     * Review comment.
     */
    @Schema(description = "Review comment")
    private String comment;

    /**
     * Rejection reason (required if decision is REJECTED).
     */
    @Schema(description = "Rejection reason")
    private String rejectionReason;
}
