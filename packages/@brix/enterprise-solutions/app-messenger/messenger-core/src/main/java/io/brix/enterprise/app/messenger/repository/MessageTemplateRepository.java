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
 * 消息模板仓储接口
 * 
 * v3.0 Runtime Shell 架构
 * 消息模板实体的数据访问层
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.repository;

import io.brix.enterprise.app.messenger.entity.MessageTemplate;
import io.brix.enterprise.app.messenger.enums.MessageType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 消息模板仓储接口
 * 
 * <p>提供消息模板实体的 CRUD 操作和自定义查询。
 */
@Repository
public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, String> {
    
    /**
     * 根据租户ID和模板编码查询
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @return 消息模板
     */
    Optional<MessageTemplate> findByTenantIdAndTemplateCode(String tenantId, String templateCode);
    
    /**
     * 根据租户ID和模板编码查询启用的模板
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @return 消息模板
     */
    Optional<MessageTemplate> findByTenantIdAndTemplateCodeAndEnabledTrue(
        String tenantId, String templateCode);
    
    /**
     * 分页查询租户的所有模板
     * 
     * @param tenantId 租户ID
     * @param pageable 分页参数
     * @return 模板分页列表
     */
    Page<MessageTemplate> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    
    /**
     * 根据消息类型查询模板
     * 
     * @param tenantId    租户ID
     * @param messageType 消息类型
     * @return 模板列表
     */
    List<MessageTemplate> findByTenantIdAndMessageTypeAndEnabledTrue(
        String tenantId, MessageType messageType);
    
    /**
     * 检查模板编码是否存在
     * 
     * @param tenantId     租户ID
     * @param templateCode 模板编码
     * @return 是否存在
     */
    boolean existsByTenantIdAndTemplateCode(String tenantId, String templateCode);
}
