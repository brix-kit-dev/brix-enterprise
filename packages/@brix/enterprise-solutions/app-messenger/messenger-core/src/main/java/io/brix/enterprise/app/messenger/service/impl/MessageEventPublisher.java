/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.messenger.service.impl;

import io.brix.enterprise.app.messenger.entity.Message;
import io.brix.enterprise.app.messenger.event.MessageReadEvent;
import io.brix.enterprise.app.messenger.event.MessageSentEvent;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Component;

/**
 * Publishes message lifecycle events via {@code EventBusCapability}.
 *
 * <p>Event publishing failures are logged but never propagate – they must not
 * break the primary send/read workflow.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Component
class MessageEventPublisher {

    private final RuntimeContext context;

    MessageEventPublisher(RuntimeContext context) {
        this.context = context;
    }

    private ObservabilityCapability getLog() {
        return context.getObservability();
    }

    /**
     * Publishes a {@link MessageSentEvent} integration event.
     */
    void publishMessageSentEvent(Message message) {
        try {
            MessageSentEvent event = MessageSentEvent.builder()
                .messageId(message.getMessageId())
                .tenantId(message.getTenantId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .messageType(message.getType())
                .title(message.getTitle())
                .sentAt(message.getCreatedAt())
                .referenceId(message.getReferenceId())
                .referenceType(message.getReferenceType())
                .build();

            context.getEventBus().publishIntegration(event);
            getLog().info("Message sent event published: messageId={}", message.getMessageId());
        } catch (Exception e) {
            getLog().error("Failed to publish message sent event: {}", e.getMessage(), e);
        }
    }

    /**
     * Publishes a {@link MessageReadEvent} integration event.
     */
    void publishMessageReadEvent(Message message) {
        try {
            MessageReadEvent event = MessageReadEvent.builder()
                .messageId(message.getMessageId())
                .tenantId(message.getTenantId())
                .readerId(message.getReceiverId())
                .senderId(message.getSenderId())
                .readAt(message.getReadAt())
                .build();

            context.getEventBus().publishIntegration(event);
            getLog().info("Message read event published: messageId={}", message.getMessageId());
        } catch (Exception e) {
            getLog().error("Failed to publish message read event: {}", e.getMessage(), e);
        }
    }
}
