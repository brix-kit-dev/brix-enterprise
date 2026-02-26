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

import java.time.LocalDateTime;

/**
 * Intake Checklist Item Data Transfer Object.
 * <p>
 * Represents a single document requirement within an intake task.
 * Each item defines what document is required, its acceptance criteria,
 * and tracks the submission/review status.
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Intake Checklist Item DTO")
public class IntakeChecklistItemDTO {

    /**
     * Unique identifier of the checklist item.
     */
    @Schema(description = "Checklist item ID", example = "10001")
    private Long id;

    /**
     * Parent intake task ID.
     */
    @Schema(description = "Parent task ID", example = "1001")
    private Long taskId;

    /**
     * Item code for reference (e.g., DOC-001).
     */
    @NotNull
    @Schema(description = "Item code", example = "DOC-001")
    private String itemCode;

    /**
     * Display name of the required document.
     */
    @NotNull
    @Schema(description = "Item name", example = "Medical History Report")
    private String name;

    /**
     * Detailed description of what is required.
     */
    @Schema(description = "Item description", example = "Provide medical history from the past 5 years")
    private String description;

    /**
     * Document category for grouping.
     */
    @Schema(description = "Category", example = "MEDICAL_RECORDS")
    private IntakeDocumentCategory category;

    /**
     * Current status of this checklist item.
     */
    @NotNull
    @Schema(description = "Item status", example = "PENDING")
    private IntakeItemStatus status;

    /**
     * Whether this item is mandatory.
     */
    @Schema(description = "Is required", example = "true")
    private Boolean required;

    /**
     * Display order within the checklist.
     */
    @Schema(description = "Sort order", example = "1")
    private Integer sortOrder;

    /**
     * Accepted file formats (comma-separated).
     */
    @Schema(description = "Accepted formats", example = "PDF,JPG,PNG")
    private String acceptedFormats;

    /**
     * Maximum file size in bytes.
     */
    @Schema(description = "Max file size in bytes", example = "10485760")
    private Long maxFileSize;

    /**
     * Minimum number of files required.
     */
    @Schema(description = "Min files", example = "1")
    private Integer minFiles;

    /**
     * Maximum number of files allowed.
     */
    @Schema(description = "Max files", example = "5")
    private Integer maxFiles;

    /**
     * Example or sample document URL.
     */
    @Schema(description = "Sample document URL")
    private String sampleDocumentUrl;

    /**
     * ID of the uploaded file (from storage service).
     */
    @Schema(description = "Uploaded file ID", example = "file-uuid-1234")
    private String uploadedFileId;

    /**
     * Name of the uploaded file.
     */
    @Schema(description = "Uploaded file name", example = "medical_history.pdf")
    private String uploadedFileName;

    /**
     * Upload timestamp.
     */
    @Schema(description = "Uploaded at")
    private LocalDateTime uploadedAt;

    /**
     * ID of user who uploaded the file.
     */
    @Schema(description = "Uploaded by")
    private String uploadedBy;

    /**
     * Review status.
     */
    @Schema(description = "Review status", example = "APPROVED")
    private IntakeReviewStatus reviewStatus;

    /**
     * Review comment from reviewer.
     */
    @Schema(description = "Review comment")
    private String reviewComment;

    /**
     * Rejection reason if rejected.
     */
    @Schema(description = "Rejection reason")
    private String rejectionReason;

    /**
     * Reviewer user ID.
     */
    @Schema(description = "Reviewed by")
    private String reviewedBy;

    /**
     * Review timestamp.
     */
    @Schema(description = "Reviewed at")
    private LocalDateTime reviewedAt;

    /**
     * Retry count for resubmissions.
     */
    @Schema(description = "Retry count", example = "0")
    private Integer retryCount;

    /**
     * Help text for the customer.
     */
    @Schema(description = "Help text")
    private String helpText;

    /**
     * Additional validation rules (JSON format).
     */
    @Schema(description = "Validation rules in JSON format")
    private String validationRules;
}
