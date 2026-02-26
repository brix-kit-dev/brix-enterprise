/**
 * 消息模板实体
 * 
 * v3.0 Runtime Shell 架构
 * 消息模板的持久化实体
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.messenger.entity;

import com.shinwa.app.messenger.enums.MessageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 消息模板实体
 * 
 * <p>消息模板的 JPA 持久化实体，用于定义可复用的消息模板。
 * 
 * <p>模板支持变量替换，使用 ${variableName} 格式的占位符。
 */
@Entity
@Table(
    name = "msg_template",
    indexes = {
        @Index(name = "idx_template_code", columnList = "tenant_id, template_code", unique = true),
        @Index(name = "idx_template_type", columnList = "tenant_id, message_type")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageTemplate {
    
    /**
     * 模板ID（主键）
     */
    @Id
    @Column(name = "template_id", length = 36, nullable = false)
    private String templateId;
    
    /**
     * 租户ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 模板编码
     * 用于业务调用的唯一标识
     */
    @Column(name = "template_code", length = 100, nullable = false)
    private String templateCode;
    
    /**
     * 模板名称
     */
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    /**
     * 模板描述
     */
    @Column(name = "description", length = 500)
    private String description;
    
    /**
     * 消息类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 20, nullable = false)
    private MessageType messageType;
    
    /**
     * 标题模板
     * 支持 ${variable} 格式的变量占位符
     */
    @Column(name = "title_template", length = 200, nullable = false)
    private String titleTemplate;
    
    /**
     * 内容模板
     * 支持 ${variable} 格式的变量占位符
     */
    @Column(name = "content_template", columnDefinition = "TEXT", nullable = false)
    private String contentTemplate;
    
    /**
     * 支持的通知渠道
     * 以逗号分隔的渠道列表，如 "IN_APP,PUSH,EMAIL"
     */
    @Column(name = "channels", length = 200)
    private String channels;
    
    /**
     * 是否启用
     */
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    
    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
