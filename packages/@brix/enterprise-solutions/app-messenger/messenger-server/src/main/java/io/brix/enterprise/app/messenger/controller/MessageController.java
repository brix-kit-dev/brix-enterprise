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
 * 消息控制器
 * 
 * <p>v3.0 Runtime Shell 架构
 * <p>提供站内消息的 REST API
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.controller;

import io.brix.enterprise.app.messenger.dto.MessageDTO;
import io.brix.enterprise.app.messenger.dto.PagedRequest;
import io.brix.enterprise.app.messenger.dto.PagedResponse;
import io.brix.enterprise.app.messenger.enums.MessageStatus;
import io.brix.enterprise.app.messenger.request.SendMessageRequest;
import io.brix.enterprise.app.messenger.service.MessageService;
import io.runtime.sdk.capability.AuthContextCapability;
import io.runtime.sdk.capability.TenantAwarePrincipal;
import io.runtime.sdk.context.RuntimeContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * 消息控制器
 * 
 * <p>提供站内消息管理的 REST API 接口：
 * <ul>
 *   <li>POST /api/v1/messenger/messages - 发送消息</li>
 *   <li>GET /api/v1/messenger/messages/{messageId} - 获取消息详情</li>
 *   <li>GET /api/v1/messenger/messages/inbox - 收件箱列表</li>
 *   <li>GET /api/v1/messenger/messages/outbox - 发件箱列表</li>
 *   <li>POST /api/v1/messenger/messages/{messageId}/read - 标记已读</li>
 *   <li>POST /api/v1/messenger/messages/read-all - 全部已读</li>
 *   <li>GET /api/v1/messenger/messages/unread-count - 未读数量</li>
 * </ul>
 * 
 * <p>通过 RuntimeContext 获取当前用户信息。
 */
@Tag(name = "Messages", description = "消息管理 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/messenger/messages")
@RequiredArgsConstructor
public class MessageController {

    private static final String TENANT_CONTEXT_REQUIRED_MESSAGE =
            "Tenant context is required for messenger operations";
    
    /** 消息服务 */
    private final MessageService messageService;
    
    /** 运行时上下文 */
    private final RuntimeContext context;
    
    /**
     * 发送消息
     * 
     * <p>支持直接发送和模板发送两种方式。
     * 
     * @param request 发送请求
     * @return 发送的消息
     */
    @Operation(summary = "发送消息", description = "发送站内消息，支持直接发送和模板发送两种方式")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "发送成功",
            content = @Content(schema = @Schema(implementation = MessageDTO.class))),
        @ApiResponse(responseCode = "400", description = "请求参数无效", content = @Content)
    })
    @PostMapping
    public ResponseEntity<MessageDTO> send(
            @Parameter(description = "发送消息请求", required = true)
            @Valid @RequestBody SendMessageRequest request) {
        log.info("发送消息请求: receiverId={}", request.getReceiverId());
        
        String tenantId = getCurrentTenantId();
        String senderId = getCurrentUserId();
        
        MessageDTO message = messageService.send(tenantId, senderId, request);
        return ResponseEntity.ok(message);
    }
    
    /**
     * 使用模板发送消息
     * 
     * @param templateCode 模板编码
     * @param receiverId   接收者ID
     * @param variables    模板变量
     * @return 发送的消息
     */
    @Operation(summary = "模板发送消息", description = "使用预定义的消息模板发送站内消息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "发送成功",
            content = @Content(schema = @Schema(implementation = MessageDTO.class))),
        @ApiResponse(responseCode = "400", description = "模板不存在或参数无效", content = @Content)
    })
    @PostMapping("/template/{templateCode}")
    public ResponseEntity<MessageDTO> sendByTemplate(
            @Parameter(description = "模板编码", required = true, example = "NOTIFY_ORDER_CREATED")
            @PathVariable String templateCode,
            @Parameter(description = "接收者ID", required = true, example = "U20260214001")
            @RequestParam String receiverId,
            @Parameter(description = "模板变量")
            @RequestBody(required = false) Map<String, String> variables) {
        log.info("使用模板发送消息: templateCode={}, receiverId={}", templateCode, receiverId);
        
        String tenantId = getCurrentTenantId();
        
        MessageDTO message = messageService.sendByTemplate(
            tenantId, templateCode, receiverId, variables != null ? variables : Map.of());
        return ResponseEntity.ok(message);
    }
    
    /**
     * 获取消息详情
     * 
     * @param messageId 消息ID
     * @return 消息详情
     */
    @Operation(summary = "获取消息详情", description = "根据消息ID获取消息详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = MessageDTO.class))),
        @ApiResponse(responseCode = "404", description = "消息不存在", content = @Content)
    })
    @GetMapping("/{messageId}")
    public ResponseEntity<MessageDTO> getById(
            @Parameter(description = "消息ID", required = true, example = "MSG20260214001")
            @PathVariable String messageId) {
        log.info("获取消息详情: messageId={}", messageId);
        
        return messageService.getById(messageId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 获取收件箱列表
     * 
     * @param status 消息状态过滤
     * @param page   页码（从0开始）
     * @param size   每页大小
     * @return 消息分页列表
     */
    @Operation(summary = "获取收件箱", description = "获取当前用户的收件箱消息列表，支持状态筛选和分页")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/inbox")
    public ResponseEntity<PagedResponse<MessageDTO>> getInbox(
            @Parameter(description = "消息状态筛选", example = "UNREAD")
            @RequestParam(required = false) MessageStatus status,
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        log.info("获取收件箱: status={}, page={}, size={}", status, page, size);
        
        String tenantId = getCurrentTenantId();
        String receiverId = getCurrentUserId();
        PagedRequest request = new PagedRequest(page, size);
        
        PagedResponse<MessageDTO> messages = messageService.getInbox(tenantId, receiverId, status, request);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * 获取发件箱列表
     * 
     * @param page 页码
     * @param size 每页大小
     * @return 消息分页列表
     */
    @Operation(summary = "获取发件箱", description = "获取当前用户的发件箱消息列表，支持分页")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/outbox")
    public ResponseEntity<PagedResponse<MessageDTO>> getOutbox(
            @Parameter(description = "页码（从0开始）", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        log.info("获取发件箱: page={}, size={}", page, size);
        
        String tenantId = getCurrentTenantId();
        String senderId = getCurrentUserId();
        PagedRequest request = new PagedRequest(page, size);
        
        PagedResponse<MessageDTO> messages = messageService.getOutbox(tenantId, senderId, request);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * 标记消息为已读
     * 
     * @param messageId 消息ID
     * @return 无内容
     */
    @Operation(summary = "标记已读", description = "将指定消息标记为已读状态")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "标记成功"),
        @ApiResponse(responseCode = "404", description = "消息不存在", content = @Content)
    })
    @PostMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @Parameter(description = "消息ID", required = true, example = "MSG20260214001")
            @PathVariable String messageId) {
        log.info("标记已读: messageId={}", messageId);
        
        String readerId = getCurrentUserId();
        messageService.markAsRead(messageId, readerId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 批量标记为已读
     * 
     * @param messageIds 消息ID列表
     * @return 无内容
     */
    @Operation(summary = "批量标记已读", description = "批量将多条消息标记为已读状态")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "标记成功")
    })
    @PostMapping("/read-batch")
    public ResponseEntity<Void> markAsReadBatch(
            @Parameter(description = "消息ID列表", required = true)
            @RequestBody List<String> messageIds) {
        log.info("批量标记已读: count={}", messageIds.size());
        
        String readerId = getCurrentUserId();
        messageService.markAsReadBatch(messageIds, readerId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 全部标记为已读
     * 
     * @return 无内容
     */
    @Operation(summary = "全部标记已读", description = "将当前用户的所有未读消息标记为已读")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "标记成功")
    })
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        log.info("全部标记已读");
        
        String tenantId = getCurrentTenantId();
        String receiverId = getCurrentUserId();
        messageService.markAllAsRead(tenantId, receiverId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 归档消息
     * 
     * @param messageId 消息ID
     * @return 无内容
     */
    @Operation(summary = "归档消息", description = "将指定消息移动到归档")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "归档成功"),
        @ApiResponse(responseCode = "404", description = "消息不存在", content = @Content)
    })
    @PostMapping("/{messageId}/archive")
    public ResponseEntity<Void> archive(
            @Parameter(description = "消息ID", required = true, example = "MSG20260214001")
            @PathVariable String messageId) {
        log.info("归档消息: messageId={}", messageId);
        
        String userId = getCurrentUserId();
        messageService.archive(messageId, userId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 删除消息
     * 
     * @param messageId 消息ID
     * @return 无内容
     */
    @Operation(summary = "删除消息", description = "删除指定消息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "消息不存在", content = @Content)
    })
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "消息ID", required = true, example = "MSG20260214001")
            @PathVariable String messageId) {
        log.info("删除消息: messageId={}", messageId);
        
        String userId = getCurrentUserId();
        messageService.delete(messageId, userId);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 获取未读消息数量
     * 
     * @return 未读数量
     */
    @Operation(summary = "获取未读数量", description = "获取当前用户的未读消息数量")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        log.info("获取未读数量");
        
        String tenantId = getCurrentTenantId();
        String receiverId = getCurrentUserId();
        
        long count = messageService.getUnreadCount(tenantId, receiverId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    // ==================== 辅助方法 ====================
    
    /**
     * 获取当前租户ID
     * 
     * @return 租户ID
     */
    private String getCurrentTenantId() {
        AuthContextCapability authContext = context.getAuthContext();
        String tenantId = authContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, TENANT_CONTEXT_REQUIRED_MESSAGE);
        }
        return tenantId;
    }
    
    /**
     * 获取当前用户ID
     * 
     * @return 用户ID
     */
    private String getCurrentUserId() {
        Principal principal = context.getAuthContext().getCurrentPrincipal();
        if (principal == null) {
            return "anonymous";
        }
        if (principal instanceof TenantAwarePrincipal) {
            return ((TenantAwarePrincipal) principal).getUserId();
        }
        return principal.getName();
    }
}
