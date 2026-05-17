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
 * 消息服务接口
 * 
 * v3.0 Runtime Shell 架构
 * 定义消息服务的公共接口
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.service;

import io.brix.enterprise.app.messenger.dto.MessageDTO;
import io.brix.enterprise.app.messenger.dto.PagedRequest;
import io.brix.enterprise.app.messenger.dto.PagedResponse;
import io.brix.enterprise.app.messenger.enums.MessageStatus;
import io.brix.enterprise.app.messenger.request.SendMessageRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 消息服务接口
 * 
 * <p>提供站内消息的核心业务功能：
 * <ul>
 *   <li>消息发送（直接发送和模板发送）</li>
 *   <li>消息查询（收件箱、发件箱）</li>
 *   <li>消息状态管理（已读、归档、删除）</li>
 *   <li>未读统计</li>
 * </ul>
 * 
 * <p>实现类需要通过 RuntimeContext 获取能力契约，
 * 禁止直接依赖基础设施组件。
 */
public interface MessageService {
    
    /**
     * 发送消息
     * 
     * <p>支持直接指定内容发送，或使用模板发送。
     * 发送成功后会发布 MessageSentEvent 事件。
     * 
     * @param tenantId 租户ID
     * @param senderId 发送者ID
     * @param request  发送请求
     * @return 发送的消息
     */
    MessageDTO send(String tenantId, String senderId, SendMessageRequest request);
    
    /**
     * 使用模板发送消息
     * 
     * <p>根据模板编码获取模板，替换变量后发送消息。
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @param receiverId   接收者ID
     * @param variables    模板变量
     * @return 发送的消息
     */
    MessageDTO sendByTemplate(String tenantId, String templateCode, 
                              String receiverId, Map<String, String> variables);
    
    /**
     * 根据消息ID获取消息详情
     * 
     * @param messageId 消息ID
     * @return 消息详情，不存在返回回 empty
     */
    Optional<MessageDTO> getById(String messageId);
    
    /**
     * 分页查询收件箱
     * 
     * <p>获取指定用户的收件箱消息列表，
     * 按创建时间倒序排列。
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param status     消息状态，null 表示不过滤
     * @param request    分页请求参数
     * @return 消息分页列表
     */
    PagedResponse<MessageDTO> getInbox(String tenantId, String receiverId, 
                                       MessageStatus status, PagedRequest request);
    
    /**
     * 分页查询发件箱
     * 
     * <p>获取指定用户发送的消息列表，
     * 按创建时间倒序排列。
     * 
     * @param tenantId 租户ID
     * @param senderId 发送者ID
     * @param request  分页请求参数
     * @return 消息分页列表
     */
    PagedResponse<MessageDTO> getOutbox(String tenantId, String senderId, PagedRequest request);
    
    /**
     * 标记消息为已读
     * 
     * <p>将指定消息标记为已读状态，并发布 MessageReadEvent 事件。
     * 
     * @param messageId 消息ID
     * @param readerId  读取者ID（必须是消息接收者）
     */
    void markAsRead(String messageId, String readerId);
    
    /**
     * 批量标记为已读
     * 
     * @param messageIds 消息ID列表
     * @param readerId   读取者ID
     */
    void markAsReadBatch(List<String> messageIds, String readerId);
    
    /**
     * 全部标记为已读
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     */
    void markAllAsRead(String tenantId, String receiverId);
    
    /**
     * 归档消息
     * 
     * @param messageId 消息ID
     * @param userId    操作用户ID
     */
    void archive(String messageId, String userId);
    
    /**
     * 删除消息（软删除）
     * 
     * @param messageId 消息ID
     * @param userId    操作用户ID
     */
    void delete(String messageId, String userId);
    
    /**
     * 获取未读消息数量
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @return 未读消息数量
     */
    long getUnreadCount(String tenantId, String receiverId);
}
