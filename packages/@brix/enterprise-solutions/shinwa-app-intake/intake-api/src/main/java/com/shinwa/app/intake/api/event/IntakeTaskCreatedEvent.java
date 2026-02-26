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
 * Domain event fired when an intake task is created.
 * <p>
 * This event is published when a new intake task is created.
 * Subscribers can use this to trigger notifications or update related systems.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Extends DomainEvent from runtime-sdk-api</li>
 *   <li>Contains only serializable data</li>
 *   <li>Event routing handled by Runtime Shell</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class IntakeTaskCreatedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    /**
     * The ID of the created intake task.
     */
    private Long taskId;

    /**
     * The task number.
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
     * Customer name.
     */
    private String customerName;

    /**
     * Task title.
     */
    private String title;

    /**
     * Number of required documents.
     */
    private Integer totalItems;

    /**
     * Due date (ISO format).
     */
    private String dueDate;

    @Override
    public String getEventType() {
        return "intake.task.created";
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
