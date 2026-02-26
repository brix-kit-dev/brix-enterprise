/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.api.event;

import io.runtime.sdk.event.DomainEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Domain event fired when an intake task is completed.
 * <p>
 * This event is published when all required documents are approved.
 * The Case module should subscribe to this event to advance the workflow.
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class IntakeTaskCompletedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    /**
     * Intake task ID.
     */
    private Long taskId;

    /**
     * Task number.
     */
    private String taskNo;

    /**
     * Associated case ID.
     */
    private Long caseId;

    /**
     * Associated case node ID.
     */
    private Long caseNodeId;

    /**
     * Customer ID.
     */
    private Long customerId;

    /**
     * Total approved documents.
     */
    private Integer approvedItems;

    /**
     * Completion timestamp (ISO format).
     */
    private String completedAt;

    /**
     * Reviewer ID who completed the review.
     */
    private String reviewerId;

    @Override
    public String getEventType() {
        return "intake.task.completed";
    }

    @Override
    public String getAggregateType() {
        return "IntakeTask";
    }

    @Override
    public String getAggregateId() {
        return String.valueOf(taskId);
    }
}
