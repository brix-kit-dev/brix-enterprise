/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request object for updating an intake task.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Update Intake Task Request")
public class UpdateIntakeTaskRequest {

    /**
     * Task title.
     */
    @Schema(description = "Task title")
    private String title;

    /**
     * Task description.
     */
    @Schema(description = "Task description")
    private String description;

    /**
     * Due date.
     */
    @Schema(description = "Due date")
    private LocalDate dueDate;

    /**
     * Instructions for customer.
     */
    @Schema(description = "Instructions")
    private String instructions;

    /**
     * Task priority.
     */
    @Schema(description = "Priority")
    private String priority;

    /**
     * Allow partial submission.
     */
    @Schema(description = "Allow partial submission")
    private Boolean allowPartialSubmission;

    /**
     * Enable reminders.
     */
    @Schema(description = "Enable reminders")
    private Boolean reminderEnabled;

    /**
     * Assigned reviewer ID.
     */
    @Schema(description = "Assigned reviewer ID")
    private String assignedReviewerId;

    /**
     * Reviewer notes.
     */
    @Schema(description = "Reviewer notes")
    private String reviewerNotes;
}
