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

import java.time.LocalDate;
import java.util.List;

/**
 * Request object for creating a new intake task.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Create Intake Task Request")
public class CreateIntakeTaskRequest {

    /**
     * Task title.
     */
    @NotBlank(message = "Title is required")
    @Schema(description = "Task title", example = "Medical Document Collection")
    private String title;

    /**
     * Task description.
     */
    @Schema(description = "Task description")
    private String description;

    /**
     * Associated case ID.
     */
    @Schema(description = "Associated case ID", example = "1234")
    private Long caseId;

    /**
     * Associated case node ID.
     */
    @Schema(description = "Associated case node ID", example = "5001")
    private Long caseNodeId;

    /**
     * Customer ID.
     */
    @NotNull(message = "Customer ID is required")
    @Schema(description = "Customer ID", example = "2001")
    private Long customerId;

    /**
     * Template ID to use for checklist.
     */
    @Schema(description = "Template ID", example = "100")
    private Long templateId;

    /**
     * Due date for submission.
     */
    @Schema(description = "Due date", example = "2026-03-15")
    private LocalDate dueDate;

    /**
     * Instructions for the customer.
     */
    @Schema(description = "Instructions")
    private String instructions;

    /**
     * Task priority.
     */
    @Schema(description = "Priority", example = "NORMAL")
    private String priority;

    /**
     * Whether to allow partial submission.
     */
    @Schema(description = "Allow partial submission", example = "true")
    private Boolean allowPartialSubmission;

    /**
     * Whether to enable reminder notifications.
     */
    @Schema(description = "Enable reminders", example = "true")
    private Boolean reminderEnabled;

    /**
     * Checklist items to add (if not using template).
     */
    @Schema(description = "Checklist items")
    private List<CreateChecklistItemRequest> checklistItems;

    /**
     * Assigned reviewer ID.
     */
    @Schema(description = "Assigned reviewer ID")
    private String assignedReviewerId;
}
