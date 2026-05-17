/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.core.service;

import io.brix.enterprise.app.intake.api.event.IntakeDocumentSubmittedEvent;
import io.brix.enterprise.app.intake.api.event.IntakeTaskCompletedEvent;
import io.brix.enterprise.app.intake.api.event.IntakeTaskCreatedEvent;
import io.brix.enterprise.app.intake.core.domain.IntakeChecklistItem;
import io.brix.enterprise.app.intake.core.domain.IntakeTask;
import io.runtime.sdk.capability.EventBusCapability;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Publishes intake task lifecycle events via {@link EventBusCapability}.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Component
@RequiredArgsConstructor
class IntakeEventPublisher {

    private final EventBusCapability eventBus;

    void publishTaskCreatedEvent(IntakeTask task) {
        IntakeTaskCreatedEvent event = IntakeTaskCreatedEvent.builder()
            .taskId(task.getId())
            .taskNo(task.getTaskNo())
            .caseId(task.getCaseId())
            .caseNodeId(task.getCaseNodeId())
            .customerId(task.getCustomerId())
            .customerName(task.getCustomerName())
            .title(task.getTitle())
            .totalItems(task.getTotalItems())
            .dueDate(task.getDueDate() != null ? task.getDueDate().toString() : null)
            .build();
        eventBus.publish(event);
    }

    void publishDocumentSubmittedEvent(IntakeTask task, IntakeChecklistItem item) {
        IntakeDocumentSubmittedEvent event = IntakeDocumentSubmittedEvent.builder()
            .taskId(task.getId())
            .itemId(item.getId())
            .itemCode(item.getItemCode())
            .itemName(item.getName())
            .fileId(item.getUploadedFileId())
            .fileName(item.getUploadedFileName())
            .customerId(task.getCustomerId())
            .submittedAt(item.getUploadedAt().toString())
            .build();
        eventBus.publish(event);
    }

    void publishTaskCompletedEvent(IntakeTask task, String reviewerId) {
        IntakeTaskCompletedEvent event = IntakeTaskCompletedEvent.builder()
            .taskId(task.getId())
            .taskNo(task.getTaskNo())
            .caseId(task.getCaseId())
            .caseNodeId(task.getCaseNodeId())
            .customerId(task.getCustomerId())
            .approvedItems(task.getApprovedItems())
            .completedAt(LocalDateTime.now().toString())
            .reviewerId(reviewerId)
            .build();
        eventBus.publish(event);
    }
}
