/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service.impl;

import com.shinwa.app.identity.dto.UserDTO;
import com.shinwa.app.identity.entity.User;
import com.shinwa.app.identity.enums.UserRole;
import com.shinwa.app.identity.enums.UserStatus;
import com.shinwa.app.identity.event.UserCreatedEvent;
import com.shinwa.app.identity.event.UserStatusChangedEvent;
import com.shinwa.app.identity.event.UserUpdatedEvent;
import com.shinwa.app.identity.repository.UserRepository;
import com.shinwa.app.identity.request.CreateUserRequest;
import com.shinwa.app.identity.request.UpdateUserRequest;
import com.shinwa.app.identity.service.PasswordHasher;
import com.shinwa.app.identity.service.UserService;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户服务实现
 * 
 * <p>实现用户的创建、查询、更新、删除、状态管理等核心业务功能。</p>
 * 
 * <h3>架构说明</h3>
 * <p>本服务遵循 v3.0 Runtime Shell 架构：</p>
 * <ul>
 *   <li>通过 {@link RuntimeContext} 获取所有运行时能力</li>
 *   <li>使用 {@code context.getEventBus()} 发布集成事件</li>
 *   <li>使用 {@code context.getStateStore()} 进行状态缓存</li>
 *   <li>使用 {@code context.getAuthContext()} 获取当前用户/租户</li>
 *   <li><b>禁止</b>直接依赖 Kafka/Redis 等基础设施</li>
 * </ul>
 * 
 * <h3>核心业务规则</h3>
 * <ul>
 *   <li>用户名租户内唯一</li>
 *   <li>邮箱/手机号租户内唯一（如果有值）</li>
 *   <li>密码使用 BCrypt 加密存储</li>
 *   <li>状态变更需符合状态机规则</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Service
public class UserServiceImpl implements UserService {
    
    // ==================== 依赖注入 ====================
    
    /**
     * 运行时上下文
     * <p>【核心】获取所有运行时能力的唯一入口，替代直接依赖 Kafka/Redis</p>
     */
    private final RuntimeContext runtimeContext;
    
    /**
     * 用户仓库
     */
    private final UserRepository userRepository;
    
    /**
     * 密码哈希服务
     * <p>使用框架无关的 {@link PasswordHasher} 接口进行密码加密，
     * 替代原先对 Spring Security {@code PasswordEncoder} 的直接依赖。
     * 具体实现（BCrypt）由 {@link BCryptPasswordHasher} 提供。</p>
     *
     * @see PasswordHasher
     * @see BCryptPasswordHasher
     */
    private final PasswordHasher passwordHasher;
    
    // ==================== 常量定义 ====================
    
    /**
     * 用户ID日期格式
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    /**
     * 缓存 Key 前缀 - 用户详情
     */
    private static final String CACHE_KEY_USER = "identity:user:";
    
    /**
     * 缓存有效期
     */
    private static final Duration CACHE_TTL = Duration.ofHours(1);
    
    // ==================== 构造函数 ====================
    
    /**
     * 构造函数注入依赖
     *
     * @param runtimeContext 运行时上下文（核心能力入口）
     * @param userRepository 用户仓库
     * @param passwordHasher 密码哈希服务（框架无关，替代 Spring Security PasswordEncoder）
     */
    public UserServiceImpl(RuntimeContext runtimeContext, UserRepository userRepository, PasswordHasher passwordHasher) {
        this.runtimeContext = runtimeContext;
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }
    
    // ==================== 查询操作 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    public UserDTO getById(String id) {
        String tenantId = getCurrentTenantId();
        
        return userRepository.findByIdAndTenantId(id, tenantId)
                .map(this::toDTO)
                .orElse(null);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public UserDTO getByUserId(String userId) {
        String tenantId = getCurrentTenantId();
        
        // 尝试从缓存获取
        String cacheKey = CACHE_KEY_USER + userId;
        return runtimeContext.getStateStore()
                .get(cacheKey, UserDTO.class)
                .orElseGet(() -> {
                    // 缓存未命中，从数据库查询
                    return userRepository.findByIdAndTenantId(userId, tenantId)
                            .map(user -> {
                                UserDTO dto = toDTO(user);
                                // 写入缓存
                                runtimeContext.getStateStore().put(cacheKey, dto, CACHE_TTL);
                                return dto;
                            })
                            .orElse(null);
                });
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public UserDTO getByUsername(String username) {
        String tenantId = getCurrentTenantId();
        
        return userRepository.findByUsernameAndTenantId(username, tenantId)
                .map(this::toDTO)
                .orElse(null);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<UserDTO> findAll() {
        String tenantId = getCurrentTenantId();
        
        return userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<UserDTO> findByStatus(String status) {
        String tenantId = getCurrentTenantId();
        UserStatus userStatus = UserStatus.valueOf(status);
        
        return userRepository.findByStatusAndTenantIdOrderByCreatedAtDesc(userStatus, tenantId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<UserDTO> findByRole(String role) {
        String tenantId = getCurrentTenantId();
        UserRole userRole = UserRole.valueOf(role);
        
        return userRepository.findByRoleAndTenantIdOrderByCreatedAtDesc(userRole, tenantId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    // ==================== 写操作 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserDTO create(CreateUserRequest request) {
        String tenantId = getCurrentTenantId();
        
        // 1. 校验用户名唯一性
        if (userRepository.existsByUsernameAndTenantId(request.getUsername(), tenantId)) {
            throw new IllegalArgumentException("用户名已存在: " + request.getUsername());
        }
        
        // 2. 校验邮箱唯一性（如果有值）
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
                throw new IllegalArgumentException("邮箱已被使用: " + request.getEmail());
            }
        }
        
        // 3. 校验手机号唯一性（如果有值）
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            if (userRepository.existsByPhoneAndTenantId(request.getPhone(), tenantId)) {
                throw new IllegalArgumentException("手机号已被使用: " + request.getPhone());
            }
        }
        
        // 4. 生成用户ID
        String userId = generateUserId();
        
        // 5. 创建用户实体
        User user = new User(userId, tenantId, request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        
        // 6. 密码加密（使用 BCrypt）
        user.setPasswordHash(hashPassword(request.getPassword()));
        
        // 7. 保存到数据库
        user = userRepository.save(user);
        
        // 8. 记录日志
        runtimeContext.getObservability().info(
                "用户创建成功: userId={}, username={}, tenantId={}",
                user.getId(), user.getUsername(), tenantId);
        
        // 9. 发布集成事件
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
        
        return toDTO(user);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserDTO update(String userId, UpdateUserRequest request) {
        String tenantId = getCurrentTenantId();
        String currentUserId = getCurrentUserId();
        
        // 1. 查找用户
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        // 2. 记录更新的字段
        List<String> updatedFields = new ArrayList<>();
        
        // 3. 更新邮箱
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            // 校验邮箱唯一性
            if (!request.getEmail().isEmpty() && 
                userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
                throw new IllegalArgumentException("邮箱已被使用: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
            updatedFields.add("email");
        }
        
        // 4. 更新手机号
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            // 校验手机号唯一性
            if (!request.getPhone().isEmpty() &&
                userRepository.existsByPhoneAndTenantId(request.getPhone(), tenantId)) {
                throw new IllegalArgumentException("手机号已被使用: " + request.getPhone());
            }
            user.setPhone(request.getPhone());
            updatedFields.add("phone");
        }
        
        // 5. 更新显示名称
        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
            updatedFields.add("displayName");
        }
        
        // 6. 更新头像
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
            updatedFields.add("avatarUrl");
        }
        
        // 7. 更新修改时间
        user.touch();
        
        // 8. 保存到数据库
        user = userRepository.save(user);
        
        // 9. 清除缓存
        invalidateUserCache(userId);
        
        // 10. 发布更新事件（如果有字段更新）
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
        
        return toDTO(user);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void delete(String userId) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        // 软删除：设置状态为 DELETED
        String oldStatus = user.getStatus().name();
        user.setStatus(UserStatus.DELETED);
        user.touch();
        
        userRepository.save(user);
        
        // 清除缓存
        invalidateUserCache(userId);
        
        // 发布状态变更事件
        runtimeContext.getEventBus().publishIntegration(
                new UserStatusChangedEvent(
                        userId,
                        oldStatus,
                        UserStatus.DELETED.name(),
                        "用户删除",
                        tenantId,
                        LocalDateTime.now(),
                        getCurrentUserId()
                )
        );
        
        runtimeContext.getObservability().info("用户删除成功: userId={}", userId);
    }
    
    // ==================== 状态管理 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void enable(String userId, String reason) {
        changeStatus(userId, UserStatus.ACTIVE, reason);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void disable(String userId, String reason) {
        changeStatus(userId, UserStatus.DISABLED, reason);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void lock(String userId, String reason) {
        changeStatus(userId, UserStatus.LOCKED, reason);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void unlock(String userId, String reason) {
        changeStatus(userId, UserStatus.ACTIVE, reason);
    }
    
    /**
     * 变更用户状态
     *
     * @param userId    用户ID
     * @param newStatus 新状态
     * @param reason    原因说明
     */
    private void changeStatus(String userId, UserStatus newStatus, String reason) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        String oldStatus = user.getStatus().name();
        
        // 状态流转校验
        if (user.getStatus() == UserStatus.DELETED) {
            throw new IllegalArgumentException("已删除用户不能变更状态");
        }
        
        user.setStatus(newStatus);
        user.touch();
        
        userRepository.save(user);
        
        // 清除缓存
        invalidateUserCache(userId);
        
        // 发布状态变更事件
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
                "用户状态变更: userId={}, {} -> {}, reason={}",
                userId, oldStatus, newStatus.name(), reason);
    }
    
    // ==================== 密码管理 ====================
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void changePassword(String userId, String oldPassword, String newPassword) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        // 验证旧密码
        if (!verifyPassword(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("原密码错误");
        }
        
        // 设置新密码
        user.setPasswordHash(hashPassword(newPassword));
        user.touch();
        
        userRepository.save(user);
        
        runtimeContext.getObservability().info("用户密码修改成功: userId={}", userId);
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void resetPassword(String userId, String newPassword) {
        String tenantId = getCurrentTenantId();
        
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        user.setPasswordHash(hashPassword(newPassword));
        user.touch();
        
        userRepository.save(user);
        
        runtimeContext.getObservability().info("用户密码重置成功: userId={}, by={}", 
                userId, getCurrentUserId());
    }
    
    // ==================== 辅助方法 ====================
    
    /**
     * 获取当前租户ID
     *
     * @return 当前租户ID
     */
    private String getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return tenantId != null ? tenantId : "default";
    }
    
    /**
     * 获取当前用户ID
     *
     * @return 当前用户ID
     */
    private String getCurrentUserId() {
        return runtimeContext.getAuthContext()
                .getCurrentPrincipal()
                .getName();
    }
    
    /**
     * 生成用户ID
     * <p>格式: U + 日期 + 序号，如: U20260128001</p>
     *
     * @return 新的用户ID
     */
    private String generateUserId() {
        String dateStr = LocalDateTime.now().format(DATE_FORMATTER);
        // 简化处理，实际应使用分布式ID生成器
        long seq = System.currentTimeMillis() % 1000;
        return String.format("U%s%03d", dateStr, seq);
    }
    
    /**
     * 密码哈希
     *
     * <p>使用 {@link PasswordHasher} 接口进行安全的密码加密（BCrypt 算法）。
     * 不直接依赖 Spring Security，保持插件核心层框架无关。</p>
     *
     * @param password 明文密码
     * @return 密码哈希值
     * @see PasswordHasher#hash(String)
     */
    private String hashPassword(String password) {
        return passwordHasher.hash(password);
    }
    
    /**
     * 验证密码
     *
     * <p>使用 {@link PasswordHasher} 接口校验原始密码与已存储哈希值是否匹配。</p>
     *
     * @param rawPassword  明文密码
     * @param passwordHash 已存储的密码哈希值
     * @return 如果密码匹配返回 true
     * @see PasswordHasher#verify(String, String)
     */
    private boolean verifyPassword(String rawPassword, String passwordHash) {
        return passwordHasher.verify(rawPassword, passwordHash);
    }
    
    /**
     * 清除用户缓存
     *
     * @param userId 用户ID
     */
    private void invalidateUserCache(String userId) {
        String cacheKey = CACHE_KEY_USER + userId;
        runtimeContext.getStateStore().remove(cacheKey);
    }
    
    /**
     * 将实体转换为 DTO
     *
     * @param user 用户实体
     * @return 用户 DTO
     */
    private UserDTO toDTO(User user) {
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
