/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Intake Task Domain Entity.
 * <p>
 * Represents a medical document collection task. Each task manages a checklist
 * of required documents that customers must submit for review.
 * </p>
 *
 * <p><b>Aggregate Root:</b> IntakeTask is the aggregate root for the intake
 * bounded context. All modifications to checklist items should go through
 * the task entity to maintain consistency.</p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Pure domain entity with business logic</li>
 *   <li>No infrastructure dependencies</li>
 *   <li>Uses JPA annotations for persistence mapping only</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "intake_task", indexes = {
    @Index(name = "idx_intake_task_task_no", columnList = "taskNo", unique = true),
    @Index(name = "idx_intake_task_case_id", columnList = "caseId"),
    @Index(name = "idx_intake_task_customer_id", columnList = "customerId"),
    @Index(name = "idx_intake_task_status", columnList = "status"),
    @Index(name = "idx_intake_task_due_date", columnList = "dueDate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntakeTask {

    /**
     * Unique identifier.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Business task number (generated, e.g., INT-2026-0001).
     */
    @Column(nullable = false, unique = true, length = 50)
    private String taskNo;

    /**
     * Task title.
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * Task description.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Current task status.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IntakeTaskStatusEnum status;

    /**
     * Task priority.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IntakeTaskPriorityEnum priority = IntakeTaskPriorityEnum.NORMAL;

    /**
     * Associated case ID.
     */
    @Column
    private Long caseId;

    /**
     * Associated case number (snapshot for display).
     */
    @Column(length = 50)
    private String caseNo;

    /**
     * Associated case node ID (workflow step).
     */
    @Column
    private Long caseNodeId;

    /**
     * Customer ID.
     */
    @Column(nullable = false)
    private Long customerId;

    /**
     * Customer name (snapshot for display).
     */
    @Column(length = 100)
    private String customerName;

    /**
     * Customer email for notifications.
     */
    @Column(length = 200)
    private String customerEmail;

    /**
     * Customer phone.
     */
    @Column(length = 50)
    private String customerPhone;

    /**
     * Template ID used to create this task.
     */
    @Column
    private Long templateId;

    /**
     * Template name (snapshot).
     */
    @Column(length = 100)
    private String templateName;

    /**
     * Assigned reviewer user ID.
     */
    @Column(length = 50)
    private String assignedReviewerId;

    /**
     * Assigned reviewer name.
     */
    @Column(length = 100)
    private String assignedReviewerName;

    /**
     * Due date for document submission.
     */
    @Column
    private LocalDate dueDate;

    /**
     * Instructions for the customer.
     */
    @Column(columnDefinition = "TEXT")
    private String instructions;

    /**
     * Internal reviewer notes.
     */
    @Column(columnDefinition = "TEXT")
    private String reviewerNotes;

    /**
     * Whether partial submission is allowed.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean allowPartialSubmission = true;

    /**
     * Whether reminder notifications are enabled.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean reminderEnabled = true;

    /**
     * Unique submission link token (for customer access).
     */
    @Column(length = 100)
    private String submissionToken;

    /**
     * Checklist items belonging to this task.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @OrderBy("sortOrder ASC")
    private List<IntakeChecklistItem> checklistItems = new ArrayList<>();

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

    /**
     * Creator user ID.
     */
    @Column(length = 50, updatable = false)
    private String createdBy;

    /**
     * Last update user ID.
     */
    @Column(length = 50)
    private String updatedBy;

    /**
     * Optimistic locking version.
     */
    @Version
    private Long version;

    // ========================================================================
    // Business Methods
    // ========================================================================

    /**
     * Adds a checklist item to this task.
     *
     * @param item the checklist item to add
     */
    public void addChecklistItem(IntakeChecklistItem item) {
        checklistItems.add(item);
        item.setTask(this);
    }

    /**
     * Removes a checklist item from this task.
     *
     * @param item the checklist item to remove
     */
    public void removeChecklistItem(IntakeChecklistItem item) {
        checklistItems.remove(item);
        item.setTask(null);
    }

    /**
     * Calculates the total number of checklist items.
     *
     * @return total item count
     */
    public int getTotalItems() {
        return checklistItems.size();
    }

    /**
     * Calculates the number of submitted items.
     *
     * @return submitted item count
     */
    public int getSubmittedItems() {
        return (int) checklistItems.stream()
            .filter(item -> item.getUploadedFileId() != null)
            .count();
    }

    /**
     * Calculates the number of approved items.
     *
     * @return approved item count
     */
    public int getApprovedItems() {
        return (int) checklistItems.stream()
            .filter(item -> item.getReviewStatus() == IntakeReviewStatusEnum.APPROVED)
            .count();
    }

    /**
     * Calculates the number of rejected items.
     *
     * @return rejected item count
     */
    public int getRejectedItems() {
        return (int) checklistItems.stream()
            .filter(item -> item.getReviewStatus() == IntakeReviewStatusEnum.REJECTED)
            .count();
    }

    /**
     * Calculates the completion percentage (0-100).
     *
     * @return completion percentage
     */
    public int getCompletionPercent() {
        int total = getTotalItems();
        if (total == 0) {
            return 0;
        }
        return (getApprovedItems() * 100) / total;
    }

    /**
     * Checks if the task is ready for review (all required items submitted).
     *
     * @return true if ready for review
     */
    public boolean isReadyForReview() {
        return checklistItems.stream()
            .filter(IntakeChecklistItem::getRequired)
            .allMatch(item -> item.getUploadedFileId() != null);
    }

    /**
     * Checks if the task is complete (all required items approved).
     *
     * @return true if complete
     */
    public boolean isComplete() {
        return checklistItems.stream()
            .filter(IntakeChecklistItem::getRequired)
            .allMatch(item -> item.getReviewStatus() == IntakeReviewStatusEnum.APPROVED);
    }

    /**
     * Updates the task status based on current item states.
     * <p>
     * State transitions:
     * - If all required items approved → COMPLETED
     * - If any item rejected → REJECTED
     * - If all required items submitted → UNDER_REVIEW
     * - If any item submitted → IN_PROGRESS
     * - Otherwise → PENDING
     * </p>
     */
    public void updateStatusBasedOnItems() {
        if (isComplete()) {
            this.status = IntakeTaskStatusEnum.COMPLETED;
        } else if (getRejectedItems() > 0) {
            this.status = IntakeTaskStatusEnum.REJECTED;
        } else if (isReadyForReview()) {
            this.status = IntakeTaskStatusEnum.UNDER_REVIEW;
        } else if (getSubmittedItems() > 0) {
            this.status = IntakeTaskStatusEnum.IN_PROGRESS;
        } else if (this.status != IntakeTaskStatusEnum.ON_HOLD && 
                   this.status != IntakeTaskStatusEnum.CANCELLED) {
            this.status = IntakeTaskStatusEnum.PENDING;
        }
    }

    /**
     * JPA lifecycle callback: set timestamps before persist.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = IntakeTaskStatusEnum.DRAFT;
        }
    }

    /**
     * JPA lifecycle callback: update timestamp before update.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
