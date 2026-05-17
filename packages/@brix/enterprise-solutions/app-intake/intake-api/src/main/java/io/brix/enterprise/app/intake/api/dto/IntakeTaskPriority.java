/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Task Priority Enumeration.
 * <p>
 * Defines the urgency level of an intake task.
 * </p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(description = "Intake task priority")
public enum IntakeTaskPriority {

    /**
     * Low priority - Standard processing time.
     */
    @Schema(description = "Low priority")
    LOW,

    /**
     * Normal priority - Default level.
     */
    @Schema(description = "Normal priority")
    NORMAL,

    /**
     * High priority - Expedited processing.
     */
    @Schema(description = "High priority")
    HIGH,

    /**
     * Urgent - Immediate attention required.
     */
    @Schema(description = "Urgent priority")
    URGENT
}
