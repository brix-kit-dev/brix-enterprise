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
 * Domain event fired when a document is submitted to an intake task.
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class IntakeDocumentSubmittedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    /**
     * Intake task ID.
     */
    private Long taskId;

    /**
     * Checklist item ID.
     */
    private Long itemId;

    /**
     * Item code.
     */
    private String itemCode;

    /**
     * Item name.
     */
    private String itemName;

    /**
     * Uploaded file ID.
     */
    private String fileId;

    /**
     * Uploaded file name.
     */
    private String fileName;

    /**
     * Customer ID who submitted.
     */
    private Long customerId;

    /**
     * Submission timestamp (ISO format).
     */
    private String submittedAt;

    @Override
    public String getEventType() {
        return "intake.document.submitted";
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
