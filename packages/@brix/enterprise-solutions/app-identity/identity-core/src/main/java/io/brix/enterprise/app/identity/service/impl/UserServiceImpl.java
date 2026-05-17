/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import io.brix.enterprise.app.identity.dto.UserDTO;
import io.brix.enterprise.app.identity.entity.User;
import io.brix.enterprise.app.identity.enums.UserRole;
import io.brix.enterprise.app.identity.enums.UserStatus;
import io.brix.enterprise.app.identity.event.UserCreatedEvent;
import io.brix.enterprise.app.identity.event.UserStatusChangedEvent;
import io.brix.enterprise.app.identity.event.UserUpdatedEvent;
import io.brix.enterprise.app.identity.repository.UserRepository;
import io.brix.enterprise.app.identity.request.CreateUserRequest;
import io.brix.enterprise.app.identity.request.UpdateUserRequest;
import io.brix.enterprise.app.identity.service.PasswordHasher;
import io.brix.enterprise.app.identity.service.UserService;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * User service implementation (v3.0 Runtime Shell).
 *
 * <p>All capabilities accessed via {@link RuntimeContext}. Read queries are
 * cached via {@code @Cacheable} (cache name: {@code "users"}).
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
public class UserServiceImpl implements UserService {
    
    static final String CACHE_USERS = "users";
        private static final String TENANT_CONTEXT_REQUIRED_MESSAGE =
            "Tenant context is required for identity user operations";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RuntimeContext runtimeContext;
    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    
    public UserServiceImpl(RuntimeContext runtimeContext, UserRepository userRepository, PasswordHasher passwordHasher) {
        this.runtimeContext = runtimeContext;
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }
    
    // ==================== Query Operations ====================

    @Override
    @Cacheable(cacheNames = CACHE_USERS, key = "'byId:' + #id", unless = "#result == null")
    public UserDTO getById(String id) {
        String tenantId = getCurrentTenantId();
        return userRepository.findByIdAndTenantId(id, tenantId)
                .map(UserMapper::toDTO)
                .orElse(null);
    }

    @Override
    @Cacheable(cacheNames = CACHE_USERS, key = "'byUserId:' + #userId", unless = "#result == null")
    public UserDTO getByUserId(String userId) {
        String tenantId = getCurrentTenantId();
        return userRepository.findByIdAndTenantId(userId, tenantId)
                .map(UserMapper::toDTO)
                .orElse(null);
    }

    @Override
    @Cacheable(cacheNames = CACHE_USERS, key = "'byUsername:' + #username", unless = "#result == null")
    public UserDTO getByUsername(String username) {
        String tenantId = getCurrentTenantId();
        return userRepository.findByUsernameAndTenantId(username, tenantId)
                .map(UserMapper::toDTO)
                .orElse(null);
    }

    @Override
    public List<UserDTO> findAll() {
        String tenantId = getCurrentTenantId();
        return userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> findByStatus(String status) {
        String tenantId = getCurrentTenantId();
        UserStatus userStatus = UserStatus.valueOf(status);
        return userRepository.findByStatusAndTenantIdOrderByCreatedAtDesc(userStatus, tenantId)
                .stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> findByRole(String role) {
        String tenantId = getCurrentTenantId();
        UserRole userRole = UserRole.valueOf(role);
        return userRepository.findByRoleAndTenantIdOrderByCreatedAtDesc(userRole, tenantId)
                .stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    // ==================== Write Operations ====================

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public UserDTO create(CreateUserRequest request) {
        String tenantId = getCurrentTenantId();
        
        // 1. Validate username uniqueness
        if (userRepository.existsByUsernameAndTenantId(request.getUsername(), tenantId)) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        // 2. Validate email uniqueness (if provided)
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
                throw new IllegalArgumentException("Email already in use: " + request.getEmail());
            }
        }
        
        // 3. Validate phone uniqueness (if provided)
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            if (userRepository.existsByPhoneAndTenantId(request.getPhone(), tenantId)) {
                throw new IllegalArgumentException("Phone already in use: " + request.getPhone());
            }
        }
        
        // 4. Generate user ID
        String userId = generateUserId();
        
        // 5. Build user entity
        User user = new User(userId, tenantId, request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        
        // 6. Hash password
        user.setPasswordHash(passwordHasher.hash(request.getPassword()));
        
        // 7. Persist to database
        user = userRepository.save(user);
        
        // 8. Log
        runtimeContext.getObservability().info(
                "User created: userId={}, username={}, tenantId={}",
                user.getId(), user.getUsername(), tenantId);
        
        // 9. Publish integration event
        runtimeContext.getEventBus().publishIntegration(
                new UserCreatedEvent(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getPhone(),
                        tenantId,
                        user.getCreatedAt()
                )
        );
        
        return UserMapper.toDTO(user);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public UserDTO update(String userId, UpdateUserRequest request) {
        String tenantId = getCurrentTenantId();
        String currentUserId = getCurrentUserId();
        
        // 1. Find user
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        // 2. Track updated fields
        List<String> updatedFields = new ArrayList<>();
        
        // 3. Update email
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            // Validate email uniqueness
            if (!request.getEmail().isEmpty() && 
                userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
                throw new IllegalArgumentException("Email already in use: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
            updatedFields.add("email");
        }
        
        // 4. Update phone
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            // Validate phone uniqueness
            if (!request.getPhone().isEmpty() &&
                userRepository.existsByPhoneAndTenantId(request.getPhone(), tenantId)) {
                throw new IllegalArgumentException("Phone already in use: " + request.getPhone());
            }
            user.setPhone(request.getPhone());
            updatedFields.add("phone");
        }
        
        // 5. Update display name
        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
            updatedFields.add("displayName");
        }
        
        // 6. Update avatar
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
            updatedFields.add("avatarUrl");
        }
        
        // 7. Update modification timestamp
        user.touch();

        // 8. Persist to database
        user = userRepository.save(user);

        // 9. Publish update event (cache eviction handled by @CacheEvict on method)
        if (!updatedFields.isEmpty()) {
            runtimeContext.getEventBus().publishIntegration(
                    new UserUpdatedEvent(
                            userId,
                            updatedFields,
                            tenantId,
                            user.getUpdatedAt(),
                            currentUserId
                    )
            );
        }
        
        return UserMapper.toDTO(user);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public void delete(String userId) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        // Soft delete: set status to DELETED
        String oldStatus = user.getStatus().name();
        user.setStatus(UserStatus.DELETED);
        user.touch();
        
        userRepository.save(user);
        
        // Publish status change event (cache eviction handled by @CacheEvict on method)
        runtimeContext.getEventBus().publishIntegration(
                new UserStatusChangedEvent(
                        userId,
                        oldStatus,
                        UserStatus.DELETED.name(),
                        "User deleted",
                        tenantId,
                        LocalDateTime.now(),
                        getCurrentUserId()
                )
        );
        
        runtimeContext.getObservability().info("User deleted: userId={}", userId);
    }
    
    // ==================== Status Management ====================

    @Override @Transactional @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public void enable(String userId, String reason)  { changeStatus(userId, UserStatus.ACTIVE, reason); }

    @Override @Transactional @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public void disable(String userId, String reason) { changeStatus(userId, UserStatus.DISABLED, reason); }

    @Override @Transactional @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public void lock(String userId, String reason)    { changeStatus(userId, UserStatus.LOCKED, reason); }

    @Override @Transactional @CacheEvict(cacheNames = CACHE_USERS, allEntries = true)
    public void unlock(String userId, String reason)  { changeStatus(userId, UserStatus.ACTIVE, reason); }

    private void changeStatus(String userId, UserStatus newStatus, String reason) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        String oldStatus = user.getStatus().name();
        
        // State transition validation
        if (user.getStatus() == UserStatus.DELETED) {
            throw new IllegalArgumentException("Cannot change status of a deleted user");
        }
        
        user.setStatus(newStatus);
        user.touch();
        
        userRepository.save(user);
        
        // Publish status change event (cache eviction handled by caller's @CacheEvict)
        runtimeContext.getEventBus().publishIntegration(
                new UserStatusChangedEvent(
                        userId,
                        oldStatus,
                        newStatus.name(),
                        reason,
                        tenantId,
                        LocalDateTime.now(),
                        getCurrentUserId()
                )
        );
        
        runtimeContext.getObservability().info(
                "User status changed: userId={}, {} -> {}, reason={}",
                userId, oldStatus, newStatus.name(), reason);
    }
    
    // ==================== Password Management ====================

    @Override
    @Transactional
    public void changePassword(String userId, String oldPassword, String newPassword) {
        String tenantId = getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (!passwordHasher.verify(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        user.setPasswordHash(passwordHasher.hash(newPassword));
        user.touch();
        userRepository.save(user);
        runtimeContext.getObservability().info("Password changed: userId={}", userId);
    }

    @Override
    @Transactional
    public void resetPassword(String userId, String newPassword) {
        String tenantId = getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setPasswordHash(passwordHasher.hash(newPassword));
        user.touch();
        userRepository.save(user);
        runtimeContext.getObservability().info("Password reset: userId={}, by={}", userId, getCurrentUserId());
    }
    
    // ==================== Helper Methods ====================

    private String getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(TENANT_CONTEXT_REQUIRED_MESSAGE);
        }
        return tenantId;
    }

    private String getCurrentUserId() {
        return runtimeContext.getAuthContext().getCurrentPrincipal().getName();
    }

    private String generateUserId() {
        String dateStr = LocalDateTime.now().format(DATE_FORMATTER);
        long seq = System.currentTimeMillis() % 1000;
        return String.format("U%s%03d", dateStr, seq);
    }
}
