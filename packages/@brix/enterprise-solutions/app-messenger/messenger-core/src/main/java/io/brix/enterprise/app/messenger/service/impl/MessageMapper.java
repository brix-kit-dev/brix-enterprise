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

import io.brix.enterprise.app.messenger.dto.MessageDTO;
import io.brix.enterprise.app.messenger.dto.PagedRequest;
import io.brix.enterprise.app.messenger.dto.PagedResponse;
import io.brix.enterprise.app.messenger.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Stateless mapping utilities for Message entity/DTO conversion
 * and pagination parameter translation.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
final class MessageMapper {

    private MessageMapper() {}

    /**
     * Converts a {@link Message} entity to a {@link MessageDTO}.
     */
    static MessageDTO toDTO(Message message) {
        return MessageDTO.builder()
            .messageId(message.getMessageId())
            .tenantId(message.getTenantId())
            .senderId(message.getSenderId())
            .senderName(message.getSenderName())
            .receiverId(message.getReceiverId())
            .receiverName(message.getReceiverName())
            .title(message.getTitle())
            .content(message.getContent())
            .type(message.getType())
            .status(message.getStatus())
            .referenceId(message.getReferenceId())
            .referenceType(message.getReferenceType())
            .createdAt(message.getCreatedAt())
            .readAt(message.getReadAt())
            .build();
    }

    /**
     * Converts a custom {@link PagedRequest} to a Spring Data {@link Pageable}.
     *
     * <p>Encapsulates the API-to-infrastructure pagination parameter mapping,
     * keeping the service interface framework-agnostic (ref. blueprint §4 plugin model).
     */
    static Pageable toPageable(PagedRequest request) {
        if (request == null) {
            return PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (request.getSort() != null && !request.getSort().isEmpty()) {
            String[] parts = request.getSort().split(",");
            if (parts.length == 2) {
                Sort.Direction direction = "desc".equalsIgnoreCase(parts[1].trim())
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
                sort = Sort.by(direction, parts[0].trim());
            }
        }
        return PageRequest.of(request.getPage(), request.getSize(), sort);
    }

    /**
     * Converts a Spring Data {@link Page} to a framework-agnostic {@link PagedResponse}.
     */
    static <R> PagedResponse<R> toPagedResponse(Page<R> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }
}
