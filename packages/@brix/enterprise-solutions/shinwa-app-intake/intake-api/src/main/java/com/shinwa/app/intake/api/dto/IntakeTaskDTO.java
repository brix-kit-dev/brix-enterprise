/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Intake Task Data Transfer Object.
 * <p>
 * Represents a medical document collection task that tracks the submission
 * and review process of required documents for a case.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Pure DTO - no business logic</li>
 *   <li>Consistent with frontend TypeScript types in intake-shared</li>
 *   <li>Uses Jakarta Validation for input validation</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Intake Task Data Transfer Object")
public class IntakeTaskDTO {

    /**
     * Unique identifier of the intake task.
     */
    @Schema(description = "Intake task ID", example = "1001")
    private Long id;

    /**
     * Business task number (e.g., INT-2026-0001).
     */
    @NotNull
    @Schema(description = "Task number", example = "INT-2026-0001")
    private String taskNo;

    /**
     * Task title/name.
     */
    @NotNull
    @Schema(description = "Task title", example = "Medical Record Collection for Case #1234")
    private String title;

    /**
     * Task description with detailed instructions.
     */
    @Schema(description = "Task description")
    private String description;

    /**
     * Current status of the intake task.
     */
    @NotNull
    @Schema(description = "Task status", example = "PENDING")
    private IntakeTaskStatus status;

    /**
     * Associated case ID.
     */
    @Schema(description = "Associated case ID", example = "1234")
    private Long caseId;

    /**
     * Associated case number for display.
     */
    @Schema(description = "Associated case number", example = "CASE-2026-0001")
    private String caseNo;

    /**
     * Associated case node ID (workflow step).
     */
    @Schema(description = "Associated case node ID", example = "5001")
    private Long caseNodeId;

    /**
     * Customer ID who needs to submit documents.
     */
    @NotNull
    @Schema(description = "Customer ID", example = "2001")
    private Long customerId;

    /**
     * Customer name for display.
     */
    @Schema(description = "Customer name", example = "John Doe")
    private String customerName;

    /**
     * Customer email for notifications.
     */
    @Schema(description = "Customer email", example = "john.doe@example.com")
    private String customerEmail;

    /**
     * Customer phone for notifications.
     */
    @Schema(description = "Customer phone", example = "+81-90-1234-5678")
    private String customerPhone;

    /**
     * Template ID used to create this task.
     */
    @Schema(description = "Template ID", example = "100")
    private Long templateId;

    /**
     * Template name for reference.
     */
    @Schema(description = "Template name", example = "Standard Medical Intake")
    private String templateName;

    /**
     * Assigned reviewer user ID.
     */
    @Schema(description = "Assigned reviewer ID", example = "reviewer001")
    private String assignedReviewerId;

    /**
     * Assigned reviewer name for display.
     */
    @Schema(description = "Assigned reviewer name", example = "Jane Smith")
    private String assignedReviewerName;

    /**
     * Due date for document submission.
     */
    @Schema(description = "Due date", example = "2026-03-15")
    private LocalDate dueDate;

    /**
     * Total number of required documents.
     */
    @Schema(description = "Total required items", example = "5")
    private Integer totalItems;

    /**
     * Number of submitted documents.
     */
    @Schema(description = "Submitted items count", example = "3")
    private Integer submittedItems;

    /**
     * Number of approved documents.
     */
    @Schema(description = "Approved items count", example = "2")
    private Integer approvedItems;

    /**
     * Number of rejected documents requiring resubmission.
     */
    @Schema(description = "Rejected items count", example = "1")
    private Integer rejectedItems;

    /**
     * Completion percentage (0-100).
     */
    @Schema(description = "Completion percentage", example = "60")
    private Integer completionPercent;

    /**
     * Special instructions for the customer.
     */
    @Schema(description = "Instructions for customer")
    private String instructions;

    /**
     * Internal notes for reviewers.
     */
    @Schema(description = "Internal reviewer notes")
    private String reviewerNotes;

    /**
     * Checklist items for this task.
     */
    @Schema(description = "Checklist items")
    private List<IntakeChecklistItemDTO> checklistItems;

    /**
     * Priority level.
     */
    @Schema(description = "Task priority", example = "NORMAL")
    private IntakeTaskPriority priority;

    /**
     * Whether the task allows partial submission.
     */
    @Schema(description = "Allow partial submission", example = "true")
    private Boolean allowPartialSubmission;

    /**
     * Whether reminder notifications are enabled.
     */
    @Schema(description = "Reminder enabled", example = "true")
    private Boolean reminderEnabled;

    /**
     * Submission link for customer (shareable URL).
     */
    @Schema(description = "Submission link")
    private String submissionLink;

    /**
     * Creation timestamp.
     */
    @Schema(description = "Created at")
    private LocalDateTime createdAt;

    /**
     * Last update timestamp.
     */
    @Schema(description = "Updated at")
    private LocalDateTime updatedAt;

    /**
     * Creator user ID.
     */
    @Schema(description = "Created by")
    private String createdBy;

    /**
     * Last update user ID.
     */
    @Schema(description = "Updated by")
    private String updatedBy;
}
