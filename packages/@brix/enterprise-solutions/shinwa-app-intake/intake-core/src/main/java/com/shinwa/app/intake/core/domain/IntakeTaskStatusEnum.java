/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.domain;

/**
 * Intake Task Status Enumeration (Domain Layer).
 *
 * @author Shinwa Team
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
