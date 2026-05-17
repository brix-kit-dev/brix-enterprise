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
 * 消息仓储接口
 * 
 * v3.0 Runtime Shell 架构
 * 消息实体的数据访问层
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.repository;

import io.brix.enterprise.app.messenger.entity.Message;
import io.brix.enterprise.app.messenger.enums.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 消息仓储接口
 * 
 * <p>提供消息实体的 CRUD 操作和自定义查询。
 * 继承 JpaRepository 获得基础的数据访问能力。
 * 
 * <p>查询方法命名遵循 Spring Data JPA 规范，
 * 复杂查询使用 @Query 注解。
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    
    /**
     * 根据消息ID查询
     * 
     * @param messageId 消息ID
     * @return 消息实体
     */
    Optional<Message> findByMessageId(String messageId);
    
    /**
     * 分页查询收件箱（所有状态）
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param pageable   分页参数
     * @return 消息分页列表
     */
    Page<Message> findByTenantIdAndReceiverIdOrderByCreatedAtDesc(
        String tenantId, String receiverId, Pageable pageable);
    
    /**
     * 分页查询收件箱（指定状态）
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param status     消息状态
     * @param pageable   分页参数
     * @return 消息分页列表
     */
    Page<Message> findByTenantIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
        String tenantId, String receiverId, MessageStatus status, Pageable pageable);
    
    /**
     * 分页查询收件箱（排除已删除）
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param status     排除的状态
     * @param pageable   分页参数
     * @return 消息分页列表
     */
    Page<Message> findByTenantIdAndReceiverIdAndStatusNotOrderByCreatedAtDesc(
        String tenantId, String receiverId, MessageStatus status, Pageable pageable);
    
    /**
     * 分页查询发件箱
     * 
     * @param tenantId 租户ID
     * @param senderId 发送者ID
     * @param pageable 分页参数
     * @return 消息分页列表
     */
    Page<Message> findByTenantIdAndSenderIdOrderByCreatedAtDesc(
        String tenantId, String senderId, Pageable pageable);
    
    /**
     * 统计未读消息数量
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @return 未读消息数量
     */
    long countByTenantIdAndReceiverIdAndStatus(
        String tenantId, String receiverId, MessageStatus status);
    
    /**
     * 批量更新消息状态
     * 
     * @param messageIds 消息ID列表
     * @param receiverId 接收者ID
     * @param status     新状态
     * @param readAt     阅读时间（仅已读状态时设置）
     * @return 更新的记录数
     */
    @Modifying
    @Query("UPDATE Message m SET m.status = :status, m.readAt = :readAt " +
           "WHERE m.messageId IN :messageIds AND m.receiverId = :receiverId")
    int updateStatusBatch(@Param("messageIds") List<String> messageIds,
                         @Param("receiverId") String receiverId,
                         @Param("status") MessageStatus status,
                         @Param("readAt") LocalDateTime readAt);
    
    /**
     * 将所有未读消息标记为已读
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param readAt     阅读时间
     * @return 更新的记录数
     */
    @Modifying
    @Query("UPDATE Message m SET m.status = 'READ', m.readAt = :readAt " +
           "WHERE m.tenantId = :tenantId AND m.receiverId = :receiverId AND m.status = 'UNREAD'")
    int markAllAsRead(@Param("tenantId") String tenantId,
                      @Param("receiverId") String receiverId,
                      @Param("readAt") LocalDateTime readAt);
    
    /**
     * 根据业务关联查询消息
     * 
     * @param referenceType 业务类型
     * @param referenceId   业务ID
     * @return 消息列表
     */
    List<Message> findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(
        String referenceType, String referenceId);
}
