/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Checklist Item Status Enumeration.
 * <p>
 * Defines the status of individual checklist items within an intake task.
 * </p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(description = "Intake item status")
public enum IntakeItemStatus {

    /**
     * Pending - No document uploaded yet.
     */
    @Schema(description = "Pending - Awaiting submission")
    PENDING,

    /**
     * Uploaded - Document has been uploaded, awaiting review.
     */
    @Schema(description = "Uploaded - Awaiting review")
    UPLOADED,

    /**
     * Approved - Document has been approved.
     */
    @Schema(description = "Approved - Document accepted")
    APPROVED,

    /**
     * Rejected - Document has been rejected, needs resubmission.
     */
    @Schema(description = "Rejected - Needs resubmission")
    REJECTED,

    /**
     * Skipped - Item was skipped (only for optional items).
     */
    @Schema(description = "Skipped - Optional item skipped")
    SKIPPED
}
