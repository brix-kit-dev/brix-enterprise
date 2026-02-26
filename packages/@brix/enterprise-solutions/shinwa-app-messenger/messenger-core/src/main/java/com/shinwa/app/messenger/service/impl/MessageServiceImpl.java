/**
 * 消息服务实现
 * 
 * v3.0 Runtime Shell 架构
 * 通过 RuntimeContext 获取能力契约
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.messenger.service.impl;

import com.shinwa.app.messenger.dto.MessageDTO;
import com.shinwa.app.messenger.dto.PagedRequest;
import com.shinwa.app.messenger.dto.PagedResponse;
import com.shinwa.app.messenger.entity.Message;
import com.shinwa.app.messenger.entity.MessageTemplate;
import com.shinwa.app.messenger.enums.MessageStatus;
import com.shinwa.app.messenger.enums.MessageType;
import com.shinwa.app.messenger.event.MessageReadEvent;
import com.shinwa.app.messenger.event.MessageSentEvent;
import com.shinwa.app.messenger.repository.MessageRepository;
import com.shinwa.app.messenger.repository.MessageTemplateRepository;
import com.shinwa.app.messenger.request.SendMessageRequest;
import com.shinwa.app.messenger.service.MessageService;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.ObservabilityCapability;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 消息服务实现
 * 
 * <p>v3.0 Runtime Shell 架构的核心业务实现。
 * 通过 RuntimeContext 获取所有能力契约，实现业务与基础设施解耦。
 * 
 * <p>能力依赖：
 * <ul>
 *   <li>EventBusCapability - 发布消息事件</li>
 *   <li>StateStoreCapability - 缓存消息模板</li>
 *   <li>AuthContextCapability - 获取用户信息（可选）</li>
 * </ul>
 * 
 * <p>注意：本实现禁止直接依赖 Kafka、Redis 等基础设施组件。
 * 所有跨模块通信必须通过能力契约完成。
 */
@Service
@Transactional(readOnly = true)
public class MessageServiceImpl implements MessageService {
    
    /**
     * 运行时上下文
     * 提供能力契约的统一入口
     */
    private final RuntimeContext context;
    
    /**
     * 获取可观测性能力
     */
    private ObservabilityCapability getLog() {
        return context.getObservability();
    }
    
    /**
     * 消息仓储
     */
    private final MessageRepository messageRepository;
    
    /**
     * 消息模板仓储
     */
    private final MessageTemplateRepository templateRepository;
    
    /**
     * 模板变量匹配模式
     * 匹配 ${variableName} 格式的占位符
     */
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\$\\{([^}]+)}");
    
    /**
     * 模板缓存前缀
     */
    private static final String TEMPLATE_CACHE_PREFIX = "messenger:template:";
    
    /**
     * 模板缓存过期时间
     */
    private static final Duration TEMPLATE_CACHE_TTL = Duration.ofHours(1);
    
    /**
     * 构造函数
     * 
     * @param context            运行时上下文
     * @param messageRepository  消息仓储
     * @param templateRepository 模板仓储
     */
    public MessageServiceImpl(
            RuntimeContext context,
            MessageRepository messageRepository,
            MessageTemplateRepository templateRepository) {
        this.context = context;
        this.messageRepository = messageRepository;
        this.templateRepository = templateRepository;
        getLog().info("消息服务初始化完成，使用 RuntimeContext 获取能力契约");
    }
    
    /**
     * 发送消息
     * 
     * <p>支持直接发送和模板发送两种方式：
     * <ul>
     *   <li>直接发送：指定 title 和 content</li>
     *   <li>模板发送：指定 templateCode 和 variables</li>
     * </ul>
     * 
     * <p>发送成功后通过 EventBusCapability 发布 MessageSentEvent。
     * 
     * @param tenantId 租户ID
     * @param senderId 发送者ID
     * @param request  发送请求
     * @return 发送的消息DTO
     */
    @Override
    @Transactional
    public MessageDTO send(String tenantId, String senderId, SendMessageRequest request) {
        getLog().info("发送消息: tenantId={}, senderId={}, receiverId={}", 
            tenantId, senderId, request.getReceiverId());
        
        String title = request.getTitle();
        String content = request.getContent();
        
        // 如果指定了模板，使用模板渲染
        if (request.getTemplateCode() != null && !request.getTemplateCode().isEmpty()) {
            MessageTemplate template = getTemplateFromCacheOrDb(tenantId, request.getTemplateCode());
            if (template != null) {
                Map<String, String> variables = parseVariables(request.getVariables());
                title = renderTemplate(template.getTitleTemplate(), variables);
                content = renderTemplate(template.getContentTemplate(), variables);
            }
        }
        
        // 创建消息实体
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
        
        // 保存消息
        message = messageRepository.save(message);
        getLog().info("消息保存成功: messageId={}", message.getMessageId());
        
        // 发布消息发送事件
        publishMessageSentEvent(message);
        
        return toDTO(message);
    }
    
    /**
     * 使用模板发送消息
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @param receiverId   接收者ID
     * @param variables    模板变量
     * @return 发送的消息DTO
     */
    @Override
    @Transactional
    public MessageDTO sendByTemplate(String tenantId, String templateCode, 
                                     String receiverId, Map<String, String> variables) {
        getLog().info("使用模板发送消息: tenantId={}, templateCode={}, receiverId={}", 
            tenantId, templateCode, receiverId);
        
        // 获取模板
        MessageTemplate template = getTemplateFromCacheOrDb(tenantId, templateCode);
        if (template == null) {
            throw new IllegalArgumentException("消息模板不存在: " + templateCode);
        }
        
        // 渲染模板
        String title = renderTemplate(template.getTitleTemplate(), variables);
        String content = renderTemplate(template.getContentTemplate(), variables);
        
        // 创建消息
        Message message = Message.builder()
            .messageId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .senderId("SYSTEM")
            .senderName("系统通知")
            .receiverId(receiverId)
            .receiverName(getReceiverName(receiverId))
            .title(title)
            .content(content)
            .type(template.getMessageType())
            .status(MessageStatus.UNREAD)
            .build();
        
        message = messageRepository.save(message);
        publishMessageSentEvent(message);
        
        return toDTO(message);
    }
    
    /**
     * 根据消息ID获取消息详情
     * 
     * @param messageId 消息ID
     * @return 消息详情
     */
    @Override
    public Optional<MessageDTO> getById(String messageId) {
        return messageRepository.findByMessageId(messageId)
            .map(this::toDTO);
    }
    
    /**
     * 分页查询收件箱
     * 
     * <p>将自定义 PagedRequest 转换为 Spring Data Pageable 调用仓储，
     * 再将 Page 结果转换为框架无关的 PagedResponse 返回。
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @param status     消息状态
     * @param request    分页请求参数
     * @return 消息分页列表
     */
    @Override
    public PagedResponse<MessageDTO> getInbox(String tenantId, String receiverId, 
                                               MessageStatus status, PagedRequest request) {
        Pageable pageable = toPageable(request);
        Page<Message> messages;
        if (status != null) {
            messages = messageRepository.findByTenantIdAndReceiverIdAndStatusOrderByCreatedAtDesc(
                tenantId, receiverId, status, pageable);
        } else {
            // 默认排除已删除的消息
            messages = messageRepository.findByTenantIdAndReceiverIdAndStatusNotOrderByCreatedAtDesc(
                tenantId, receiverId, MessageStatus.DELETED, pageable);
        }
        return toPagedResponse(messages.map(this::toDTO));
    }
    
    /**
     * 分页查询发件箱
     * 
     * <p>将自定义 PagedRequest 转换为 Spring Data Pageable 调用仓储，
     * 再将 Page 结果转换为框架无关的 PagedResponse 返回。
     * 
     * @param tenantId 租户ID
     * @param senderId 发送者ID
     * @param request  分页请求参数
     * @return 消息分页列表
     */
    @Override
    public PagedResponse<MessageDTO> getOutbox(String tenantId, String senderId, PagedRequest request) {
        Pageable pageable = toPageable(request);
        return toPagedResponse(
            messageRepository.findByTenantIdAndSenderIdOrderByCreatedAtDesc(
                tenantId, senderId, pageable).map(this::toDTO));
    }
    
    /**
     * 标记消息为已读
     * 
     * <p>将指定消息标记为已读，并发布 MessageReadEvent。
     * 
     * @param messageId 消息ID
     * @param readerId  读取者ID
     */
    @Override
    @Transactional
    public void markAsRead(String messageId, String readerId) {
        getLog().info("标记消息已读: messageId={}, readerId={}", messageId, readerId);
        
        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("消息不存在: " + messageId));
        
        // 验证权限：只有接收者才能标记为已读
        if (!message.getReceiverId().equals(readerId)) {
            throw new IllegalArgumentException("无权限操作此消息");
        }
        
        // 只有未读状态才需要更新
        if (message.getStatus() == MessageStatus.UNREAD) {
            message.setStatus(MessageStatus.READ);
            message.setReadAt(LocalDateTime.now());
            messageRepository.save(message);
            
            // 发布已读事件
            publishMessageReadEvent(message);
        }
    }
    
    /**
     * 批量标记为已读
     * 
     * @param messageIds 消息ID列表
     * @param readerId   读取者ID
     */
    @Override
    @Transactional
    public void markAsReadBatch(List<String> messageIds, String readerId) {
        getLog().info("批量标记消息已读: count={}, readerId={}", messageIds.size(), readerId);
        
        int updated = messageRepository.updateStatusBatch(
            messageIds, readerId, MessageStatus.READ, LocalDateTime.now());
        
        getLog().info("批量更新完成: updatedCount={}", updated);
    }
    
    /**
     * 全部标记为已读
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     */
    @Override
    @Transactional
    public void markAllAsRead(String tenantId, String receiverId) {
        getLog().info("全部标记已读: tenantId={}, receiverId={}", tenantId, receiverId);
        
        int updated = messageRepository.markAllAsRead(tenantId, receiverId, LocalDateTime.now());
        
        getLog().info("全部标记已读完成: updatedCount={}", updated);
    }
    
    /**
     * 归档消息
     * 
     * @param messageId 消息ID
     * @param userId    操作用户ID
     */
    @Override
    @Transactional
    public void archive(String messageId, String userId) {
        getLog().info("归档消息: messageId={}, userId={}", messageId, userId);
        
        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("消息不存在: " + messageId));
        
        if (!message.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("无权限操作此消息");
        }
        
        message.setStatus(MessageStatus.ARCHIVED);
        messageRepository.save(message);
    }
    
    /**
     * 删除消息（软删除）
     * 
     * @param messageId 消息ID
     * @param userId    操作用户ID
     */
    @Override
    @Transactional
    public void delete(String messageId, String userId) {
        getLog().info("删除消息: messageId={}, userId={}", messageId, userId);
        
        Message message = messageRepository.findByMessageId(messageId)
            .orElseThrow(() -> new IllegalArgumentException("消息不存在: " + messageId));
        
        if (!message.getReceiverId().equals(userId) && !message.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("无权限操作此消息");
        }
        
        message.setStatus(MessageStatus.DELETED);
        messageRepository.save(message);
    }
    
    /**
     * 获取未读消息数量
     * 
     * @param tenantId   租户ID
     * @param receiverId 接收者ID
     * @return 未读消息数量
     */
    @Override
    public long getUnreadCount(String tenantId, String receiverId) {
        return messageRepository.countByTenantIdAndReceiverIdAndStatus(
            tenantId, receiverId, MessageStatus.UNREAD);
    }
    
    // ==================== 私有方法 ====================
    
    /**
     * 从缓存或数据库获取模板
     * 
     * <p>优先从 StateStoreCapability 缓存获取。
     * 缓存未命中时从数据库查询并写入缓存。
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @return 消息模板
     */
    private MessageTemplate getTemplateFromCacheOrDb(String tenantId, String templateCode) {
        String cacheKey = TEMPLATE_CACHE_PREFIX + tenantId + ":" + templateCode;
        
        // 尝试从缓存获取
        try {
            Optional<MessageTemplate> cached = context.getStateStore()
                .get(cacheKey, MessageTemplate.class);
            if (cached.isPresent()) {
                getLog().debug("从缓存获取模板: {}", cacheKey);
                return cached.get();
            }
        } catch (Exception e) {
            getLog().warn("从缓存获取模板失败: {}", e.getMessage());
        }
        
        // 从数据库查询
        Optional<MessageTemplate> template = templateRepository
            .findByTenantIdAndTemplateCodeAndEnabledTrue(tenantId, templateCode);
        
        // 写入缓存
        if (template.isPresent()) {
            try {
                context.getStateStore().put(cacheKey, template.get(), TEMPLATE_CACHE_TTL);
                getLog().debug("模板写入缓存: {}", cacheKey);
            } catch (Exception e) {
                getLog().warn("模板写入缓存失败: {}", e.getMessage());
            }
        }
        
        return template.orElse(null);
    }
    
    /**
     * 渲染模板
     * 
     * <p>将模板中的 ${variable} 占位符替换为实际值。
     * 
     * @param template  模板字符串
     * @param variables 变量映射
     * @return 渲染后的字符串
     */
    private String renderTemplate(String template, Map<String, String> variables) {
        if (template == null || variables == null || variables.isEmpty()) {
            return template;
        }
        
        StringBuffer result = new StringBuffer();
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            String value = variables.getOrDefault(variableName, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);
        
        return result.toString();
    }
    
    /**
     * 解析变量JSON字符串
     * 
     * @param variablesJson JSON格式的变量字符串
     * @return 变量映射
     */
    private Map<String, String> parseVariables(String variablesJson) {
        if (variablesJson == null || variablesJson.isEmpty()) {
            return Map.of();
        }
        
        // 简单的JSON解析，实际项目中应使用Jackson
        try {
            // 这里简化处理，实际应该使用JSON库
            return Map.of();
        } catch (Exception e) {
            getLog().warn("解析变量失败: {}", e.getMessage());
            return Map.of();
        }
    }
    
    /**
     * 发布消息发送事件
     * 
     * <p>通过 EventBusCapability 发布集成事件。
     * 
     * @param message 消息实体
     */
    private void publishMessageSentEvent(Message message) {
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
            getLog().info("消息发送事件已发布: messageId={}", message.getMessageId());
        } catch (Exception e) {
            getLog().error("发布消息发送事件失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 发布消息已读事件
     * 
     * @param message 消息实体
     */
    private void publishMessageReadEvent(Message message) {
        try {
            MessageReadEvent event = MessageReadEvent.builder()
                .messageId(message.getMessageId())
                .tenantId(message.getTenantId())
                .readerId(message.getReceiverId())
                .senderId(message.getSenderId())
                .readAt(message.getReadAt())
                .build();
            
            context.getEventBus().publishIntegration(event);
            getLog().info("消息已读事件已发布: messageId={}", message.getMessageId());
        } catch (Exception e) {
            getLog().error("发布消息已读事件失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 获取发送者名称
     * 
     * <p>TODO: 通过用户服务获取实际名称
     * 
     * @param senderId 发送者ID
     * @return 发送者名称
     */
    private String getSenderName(String senderId) {
        if ("SYSTEM".equals(senderId)) {
            return "系统通知";
        }
        // TODO: 通过用户服务查询用户名称
        return senderId;
    }
    
    /**
     * 获取接收者名称
     * 
     * @param receiverId 接收者ID
     * @return 接收者名称
     */
    private String getReceiverName(String receiverId) {
        // TODO: 通过用户服务查询用户名称
        return receiverId;
    }
    
    /**
     * 实体转DTO
     * 
     * @param message 消息实体
     * @return 消息DTO
     */
    private MessageDTO toDTO(Message message) {
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
    
    // ==================== 分页转换辅助方法 ====================
    
    /**
     * 将自定义 PagedRequest 转换为 Spring Data Pageable
     * 
     * <p>此方法封装了 API 层与基础设施层的分页参数转换，
     * 使得服务接口保持框架无关（参考蓝图 §4 插件模型规范）。
     * 
     * @param request 自定义分页请求参数
     * @return Spring Data Pageable 对象
     */
    private Pageable toPageable(PagedRequest request) {
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
     * 将 Spring Data Page 转换为自定义 PagedResponse
     * 
     * <p>此方法封装了基础设施层与 API 层的分页结果转换，
     * 确保返回类型不泄漏 Spring Data 依赖。
     * 
     * @param page Spring Data 分页结果
     * @param <R>  数据项类型
     * @return 框架无关的分页响应
     */
    private <R> PagedResponse<R> toPagedResponse(Page<R> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }
}
