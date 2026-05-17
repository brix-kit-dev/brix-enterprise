/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Review Status Enumeration.
 * <p>
 * Defines the review status of submitted documents.
 * </p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(description = "Intake review status")
public enum IntakeReviewStatus {

    /**
     * Not yet reviewed.
     */
    @Schema(description = "Not reviewed")
    NOT_REVIEWED,

    /**
     * Currently under review.
     */
    @Schema(description = "Under review")
    UNDER_REVIEW,

    /**
     * Approved by reviewer.
     */
    @Schema(description = "Approved")
    APPROVED,

    /**
     * Rejected by reviewer.
     */
    @Schema(description = "Rejected")
    REJECTED,

    /**
     * Needs clarification from customer.
     */
    @Schema(description = "Needs clarification")
    NEEDS_CLARIFICATION
}
