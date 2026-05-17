/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.core.domain;

/**
 * Intake Task Status Enumeration (Domain Layer).
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum IntakeTaskStatusEnum {
    DRAFT,
    PENDING,
    IN_PROGRESS,
    UNDER_REVIEW,
    COMPLETED,
    REJECTED,
    ON_HOLD,
    CANCELLED
}
