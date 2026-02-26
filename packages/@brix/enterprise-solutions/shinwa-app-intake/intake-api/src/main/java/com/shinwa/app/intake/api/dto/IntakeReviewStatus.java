/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Review Status Enumeration.
 * <p>
 * Defines the review status of submitted documents.
 * </p>
 *
 * @author Shinwa Team
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
