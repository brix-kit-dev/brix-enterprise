/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Intake Checklist Item Domain Entity.
 * <p>
 * Represents a single document requirement within an intake task.
 * Each item defines what document is required, acceptance criteria,
 * and tracks the submission/review status.
 * </p>
 *
 * <p><b>Aggregate Member:</b> This entity belongs to the IntakeTask aggregate.
 * All modifications should go through the parent IntakeTask entity.</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "intake_checklist_item", indexes = {
    @Index(name = "idx_checklist_item_task_id", columnList = "taskId"),
    @Index(name = "idx_checklist_item_code", columnList = "taskId, itemCode", unique = true),
    @Index(name = "idx_checklist_item_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntakeChecklistItem {

    /**
     * Unique identifier.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Parent intake task.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taskId", nullable = false)
    private IntakeTask task;

    /**
     * Item code for reference (e.g., DOC-001).
     */
    @Column(nullable = false, length = 50)
    private String itemCode;

    /**
     * Display name of the required document.
     */
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * Detailed description.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Document category.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private IntakeDocumentCategoryEnum category;

    /**
     * Current item status.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IntakeItemStatusEnum status = IntakeItemStatusEnum.PENDING;

    /**
     * Whether this item is mandatory.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean required = true;

    /**
     * Display order within the checklist.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Accepted file formats (comma-separated).
     */
    @Column(length = 200)
    @Builder.Default
    private String acceptedFormats = "PDF,JPG,PNG";

    /**
     * Maximum file size in bytes.
     */
    @Column
    @Builder.Default
    private Long maxFileSize = 10 * 1024 * 1024L; // 10MB default

    /**
     * Minimum number of files required.
     */
    @Column
    @Builder.Default
    private Integer minFiles = 1;

    /**
     * Maximum number of files allowed.
     */
    @Column
    @Builder.Default
    private Integer maxFiles = 5;

    /**
     * Sample document URL.
     */
    @Column(length = 500)
    private String sampleDocumentUrl;

    /**
     * Uploaded file ID (from storage service).
     */
    @Column(length = 100)
    private String uploadedFileId;

    /**
     * Uploaded file name.
     */
    @Column(length = 255)
    private String uploadedFileName;

    /**
     * Upload timestamp.
     */
    @Column
    private LocalDateTime uploadedAt;

    /**
     * User ID who uploaded.
     */
    @Column(length = 50)
    private String uploadedBy;

    /**
     * Review status.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private IntakeReviewStatusEnum reviewStatus = IntakeReviewStatusEnum.NOT_REVIEWED;

    /**
     * Review comment.
     */
    @Column(columnDefinition = "TEXT")
    private String reviewComment;

    /**
     * Rejection reason.
     */
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Reviewer user ID.
     */
    @Column(length = 50)
    private String reviewedBy;

    /**
     * Review timestamp.
     */
    @Column
    private LocalDateTime reviewedAt;

    /**
     * Retry count for resubmissions.
     */
    @Column
    @Builder.Default
    private Integer retryCount = 0;

    /**
     * Help text for customer.
     */
    @Column(columnDefinition = "TEXT")
    private String helpText;

    /**
     * Validation rules (JSON format).
     */
    @Column(columnDefinition = "TEXT")
    private String validationRules;

    /**
     * Creation timestamp.
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last update timestamp.
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ========================================================================
    // Business Methods
    // ========================================================================

    /**
     * Records a document submission for this item.
     *
     * @param fileId uploaded file ID
     * @param fileName file name
     * @param userId submitter user ID
     */
    public void submitDocument(String fileId, String fileName, String userId) {
        this.uploadedFileId = fileId;
        this.uploadedFileName = fileName;
        this.uploadedAt = LocalDateTime.now();
        this.uploadedBy = userId;
        this.status = IntakeItemStatusEnum.UPLOADED;
        this.reviewStatus = IntakeReviewStatusEnum.NOT_REVIEWED;
        this.reviewComment = null;
        this.rejectionReason = null;
        this.reviewedBy = null;
        this.reviewedAt = null;
    }

    /**
     * Approves this item.
     *
     * @param reviewerId reviewer user ID
     * @param comment approval comment
     */
    public void approve(String reviewerId, String comment) {
        this.reviewStatus = IntakeReviewStatusEnum.APPROVED;
        this.status = IntakeItemStatusEnum.APPROVED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.reviewComment = comment;
        this.rejectionReason = null;
    }

    /**
     * Rejects this item.
     *
     * @param reviewerId reviewer user ID
     * @param reason rejection reason
     */
    public void reject(String reviewerId, String reason) {
        this.reviewStatus = IntakeReviewStatusEnum.REJECTED;
        this.status = IntakeItemStatusEnum.REJECTED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.retryCount++;
    }

    /**
     * Clears the uploaded document (for resubmission).
     */
    public void clearDocument() {
        this.uploadedFileId = null;
        this.uploadedFileName = null;
        this.uploadedAt = null;
        this.uploadedBy = null;
        this.status = IntakeItemStatusEnum.PENDING;
        this.reviewStatus = IntakeReviewStatusEnum.NOT_REVIEWED;
        this.reviewComment = null;
        this.rejectionReason = null;
        this.reviewedBy = null;
        this.reviewedAt = null;
    }

    /**
     * JPA lifecycle callback: set timestamps before persist.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * JPA lifecycle callback: update timestamp before update.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
