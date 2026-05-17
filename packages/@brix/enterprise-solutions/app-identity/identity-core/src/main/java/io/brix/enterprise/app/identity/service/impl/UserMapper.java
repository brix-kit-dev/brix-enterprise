/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import io.brix.enterprise.app.identity.dto.UserDTO;
import io.brix.enterprise.app.identity.entity.User;

/**
 * Stateless mapping utility for User entity/DTO conversion.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
final class UserMapper {

    private UserMapper() {}

    /**
     * Converts a {@link User} entity to a {@link UserDTO}.
     */
    static UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .tenantId(user.getTenantId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
