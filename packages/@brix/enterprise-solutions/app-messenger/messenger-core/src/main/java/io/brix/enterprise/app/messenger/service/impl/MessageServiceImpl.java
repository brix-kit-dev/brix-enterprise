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
/**
 * Message service implementation.
 *
 * <p>v3.0 Runtime Shell architecture &ndash; all capabilities obtained via RuntimeContext.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.service.impl;

import io.brix.enterprise.app.messenger.dto.MessageDTO;
import io.brix.enterprise.app.messenger.dto.PagedRequest;
import io.brix.enterprise.app.messenger.dto.PagedResponse;
import io.brix.enterprise.app.messenger.entity.Message;
import io.brix.enterprise.app.messenger.entity.MessageTemplate;
import io.brix.enterprise.app.messenger.enums.MessageStatus;
import io.brix.enterprise.app.messenger.enums.MessageType;
import io.brix.enterprise.app.messenger.repository.MessageRepository;
import io.brix.enterprise.app.messenger.request.SendMessageRequest;
import io.brix.enterprise.app.messenger.service.MessageService;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.ObservabilityCapability;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Core message service implementation (v3.0 Runtime Shell).
 *
 * <p>All capabilities are obtained via {@link RuntimeContext}. Direct dependencies on
 * Kafka, Redis, or other infrastructure components are forbidden &ndash; all cross-module
 * communication goes through capability contracts.
 *
 * <p>Capability dependencies:
 * <ul>
 *   <li>{@code EventBusCapability} &ndash; via {@link MessageEventPublisher}</li>
 *   <li>{@code StateStoreCapability} &ndash; via {@link MessageTemplateRenderer}</li>
 *   <li>{@code AuthCapability} &ndash; user info (optional)</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class MessageServiceImpl implements MessageService {

    private final RuntimeContext context;
    private final MessageRepository messageRepository;
    private final MessageTemplateRenderer templateRenderer;
    private final MessageEventPublisher eventPublisher;

    private ObservabilityCapability getLog() {
        return context.getObservability();
    }

    public MessageServiceImpl(
            RuntimeContext context,
            MessageRepository messageRepository,
            MessageTemplateRenderer templateRenderer,
            MessageEventPublisher eventPublisher) {
        this.context = context;
        this.messageRepository = messageRepository;
        this.templateRenderer = templateRenderer;
        this.eventPublisher = eventPublisher;
        getLog().info("MessageService initialized with RuntimeContext capability contracts");
    }
    
    /**
     * Sends a message with direct content or via a template.
     *
     * <p>Publishes a {@code MessageSentEvent} on success via {@link MessageEventPublisher}.
     */
    @Override
    @Transactional
    public MessageDTO send(String tenantId, String senderId, SendMessageRequest request) {
        getLog().info("Sending message: tenantId={}, senderId={}, receiverId={}",
            tenantId, senderId, request.getReceiverId());

        String title = request.getTitle();
        String content = request.getContent();

        // Render via template if specified
        if (request.getTemplateCode() != null && !request.getTemplateCode().isEmpty()) {
            MessageTemplate template = templateRenderer.getTemplateFromCacheOrDb(
                tenantId, request.getTemplateCode());
            if (template != null) {
                Map<String, String> variables = templateRenderer.parseVariables(request.getVariables());
                title = templateRenderer.renderTemplate(template.getTitleTemplate(), variables);
                content = templateRenderer.renderTemplate(template.getContentTemplate(), variables);
            }
        }

        Message message = Message.builder()
            .messageId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .senderId(senderId)
            .senderName(getSenderName(senderId))
            .receiverId(request.getReceiverId())
            .receiverName(getReceiverName(request.getReceiverId()))
            .title(title)
            .content(content)
            .type(request.getType() != null ? request.getType() : MessageType.NOTIFICATION)
            .status(MessageStatus.UNREAD)
            .referenceId(request.getReferenceId())
            .referenceType(request.getReferenceType())
            .build();

        message = messageRepository.save(message);
        getLog().info("Message saved: messageId={}", message.getMessageId());

        eventPublisher.publishMessageSentEvent(message);

        return MessageMapper.toDTO(message);
    }
    
    /**
     * Sends a message using a named template.
     */
    @Override
    @Transactional
    public MessageDTO sendByTemplate(String tenantId, String templateCode,
                                     String receiverId, Map<String, String> variables) {
        getLog().info("Sending template message: tenantId={}, templateCode={}, receiverId={}",
            tenantId, templateCode, receiverId);

        MessageTemplate template = templateRenderer.getTemplateFromCacheOrDb(tenantId, templateCode);
        if (template == null) {
            throw new IllegalArgumentException("Message template not found: " + templateCode);
        }

        String title = templateRenderer.renderTemplate(template.getTitleTemplate(), variables);
        String content = templateRenderer.renderTemplate(template.getContentTemplate(), variables);

        Message message = Message.builder()
            .messageId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .senderId("SYSTEM")
            .senderName("System Notification")
            .receiverId(receiverId)
            .receiverName(getReceiverName(receiverId))
            .title(title)
            .content(content)
            .type(template.getMessageType())
            .status(MessageStatus.UNREAD)
            .build();

        message = messageRepository.save(message);
        eventPublisher.publishMessageSentEvent(message);

        return MessageMapper.toDTO(message);
    }
    
    /** {@inheritDoc} */
    @Override
    public Optional<MessageDTO> getById(String messageId) {
        return messageRepository.findByMessageId(messageId)
            .map(MessageMapper::toDTO);
    }
    
    /** {@inheritDoc} */
    @Override
    public PagedResponse<MessageDTO> getInbox(String tenantId, String receiverId,
                                               MessageStatus status, PagedRequest request) {
        Pageable pageable = MessageMapper.toPageable(request);
        Page<Message> messages;
        if (status != null) {
            messages = messageRepository.findByTenantIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
                tenantId, receiverId, status, pageable);
        } else {
            // Exclude deleted messages by default
            messages = messageRepository.findByTenantIdAndReceiverIdAndStatusNotOrderByCreatedAtDesc(
                tenantId, receiverId, MessageStatus.DELETED, pageable);
        }
        return MessageMapper.toPagedResponse(messages.map(MessageMapper::toDTO));
    }
    
    /** {@inheritDoc} */
    @Override
    public PagedResponse<MessageDTO> getOutbox(String tenantId, String senderId, PagedRequest request) {
        Pageable pageable = MessageMapper.toPageable(request);
        return MessageMapper.toPagedResponse(
            messageRepository.findByTenantIdAndSenderIdOrderByCreatedAtDesc(
                tenantId, senderId, pageable).map(MessageMapper::toDTO));
    }
    
    /** {@inheritDoc} */
    @Override
    @Transactional
    public void markAsRead(String messageId, String readerId) {
        getLog().info("Marking message as read: messageId={}, readerId={}", messageId, readerId);

        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        if (!message.getReceiverId().equals(readerId)) {
            throw new IllegalArgumentException("Not authorized to access this message");
        }

        if (message.getStatus() == MessageStatus.UNREAD) {
            message.setStatus(MessageStatus.READ);
            message.setReadAt(LocalDateTime.now());
            messageRepository.save(message);
            eventPublisher.publishMessageReadEvent(message);
        }
    }
    
    /** {@inheritDoc} */
    @Override
    @Transactional
    public void markAsReadBatch(List<String> messageIds, String readerId) {
        getLog().info("Batch mark as read: count={}, readerId={}", messageIds.size(), readerId);
        int updated = messageRepository.updateStatusBatch(
            messageIds, readerId, MessageStatus.READ, LocalDateTime.now());
        getLog().info("Batch update complete: updatedCount={}", updated);
    }
    
    /** {@inheritDoc} */
    @Override
    @Transactional
    public void markAllAsRead(String tenantId, String receiverId) {
        getLog().info("Mark all as read: tenantId={}, receiverId={}", tenantId, receiverId);
        int updated = messageRepository.markAllAsRead(tenantId, receiverId, LocalDateTime.now());
        getLog().info("Mark all as read complete: updatedCount={}", updated);
    }
    
    /** {@inheritDoc} */
    @Override
    @Transactional
    public void archive(String messageId, String userId) {
        getLog().info("Archiving message: messageId={}, userId={}", messageId, userId);

        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        if (!message.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to access this message");
        }

        message.setStatus(MessageStatus.ARCHIVED);
        messageRepository.save(message);
    }
    
    /** {@inheritDoc} */
    @Override
    @Transactional
    public void delete(String messageId, String userId) {
        getLog().info("Deleting message: messageId={}, userId={}", messageId, userId);

        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        if (!message.getReceiverId().equals(userId) && !message.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to access this message");
        }

        message.setStatus(MessageStatus.DELETED);
        messageRepository.save(message);
    }
    
    /** {@inheritDoc} */
    @Override
    public long getUnreadCount(String tenantId, String receiverId) {
        return messageRepository.countByTenantIdAndReceiverIdAndStatus(
            tenantId, receiverId, MessageStatus.UNREAD);
    }

    // ==================== Private helpers ====================

    /**
     * Resolves human-readable sender display name.
     *
     * <p><b>DECISION (2025-07, Phase 3.8):</b> Returns raw senderId as fallback.
     * Full user-service resolution deferred to v4.0 when identity-plugin
     * exposes a UserQueryCapability contract (Layer 2A). Messenger-core
     * (Layer 4 plugin) must NOT directly depend on identity-core; the
     * resolution will go through a capability contract.</p>
     *
     * @param senderId sender identifier (userId or "SYSTEM")
     * @return display name — "System Notification" for SYSTEM, raw id otherwise
     * @since 3.0.0
     */
    private String getSenderName(String senderId) {
        if ("SYSTEM".equals(senderId)) {
            return "System Notification";
        }
        // DECISION: return raw senderId until UserQueryCapability is available (v4.0)
        return senderId;
    }

    /**
     * Resolves human-readable receiver display name.
     *
     * <p><b>DECISION (2025-07, Phase 3.8):</b> Returns raw receiverId as fallback.
     * Same rationale as {@link #getSenderName(String)}.</p>
     *
     * @param receiverId receiver identifier
     * @return display name — raw id until UserQueryCapability is available
     * @since 3.0.0
     */
    private String getReceiverName(String receiverId) {
        // DECISION: return raw receiverId until UserQueryCapability is available (v4.0)
        return receiverId;
    }
}
