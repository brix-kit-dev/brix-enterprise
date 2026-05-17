/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Task Status Enumeration.
 * <p>
 * Defines the lifecycle states of an intake task.
 * State transitions follow a controlled workflow.
 * </p>
 *
 * <p><b>State Transition Diagram:</b></p>
 * <pre>
 * DRAFT → PENDING → IN_PROGRESS → UNDER_REVIEW → COMPLETED
 *                 ↓                    ↓
 *              ON_HOLD            REJECTED (returns to IN_PROGRESS)
 *                 ↓
 *             CANCELLED
 * </pre>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(description = "Intake task status")
public enum IntakeTaskStatus {

    /**
     * Draft - Initial state, task is being configured.
     */
    @Schema(description = "Draft - Task is being configured")
    DRAFT,

    /**
     * Pending - Task is created and waiting for customer to start submission.
     */
    @Schema(description = "Pending - Waiting for customer submission")
    PENDING,

    /**
     * In Progress - Customer has started submitting documents.
     */
    @Schema(description = "In Progress - Customer is submitting documents")
    IN_PROGRESS,

    /**
     * Under Review - All documents submitted, waiting for staff review.
     */
    @Schema(description = "Under Review - Staff is reviewing submissions")
    UNDER_REVIEW,

    /**
     * Completed - All documents approved, task is complete.
     */
    @Schema(description = "Completed - All documents approved")
    COMPLETED,

    /**
     * Rejected - One or more documents rejected, needs resubmission.
     */
    @Schema(description = "Rejected - Documents need resubmission")
    REJECTED,

    /**
     * On Hold - Task is temporarily paused.
     */
    @Schema(description = "On Hold - Task is paused")
    ON_HOLD,

    /**
     * Cancelled - Task is cancelled and will not be completed.
     */
    @Schema(description = "Cancelled - Task is cancelled")
    CANCELLED
}
