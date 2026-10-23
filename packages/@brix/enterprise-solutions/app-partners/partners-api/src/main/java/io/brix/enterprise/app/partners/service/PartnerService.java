/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴服务接口
 */
package io.brix.enterprise.app.partners.service;

import io.brix.enterprise.app.partners.dto.CreatePartnerRequest;
import io.brix.enterprise.app.partners.dto.PartnerDTO;
import io.brix.enterprise.app.partners.dto.UpdatePartnerRequest;
import io.brix.enterprise.app.partners.enums.PartnerStatus;
import io.brix.enterprise.app.partners.enums.PartnerType;

import java.util.List;
import java.util.Optional;

/**
 * 合作伙伴服务接口
 *
 * <p>定义合作伙伴管理的核心业务操作契约。实现类需要注入 RuntimeContext
 * 以获取各类运行时能力（状态存储、事件总线、认证上下文等）。</p>
 *
 * <h3>服务契约说明</h3>
 * <ul>
 *   <li>所有操作均需传入 tenantId 进行多租户隔离</li>
 *   <li>查询操作返回 Optional 或 List，不抛出业务异常</li>
 *   <li>修改操作在失败时抛出明确的业务异常</li>
 *   <li>状态变更操作会发布领域事件</li>
 * </ul>
 *
 * <h3>运行时依赖</h3>
 * <p>实现类通过 RuntimeContext 获取以下能力：</p>
 * <ul>
 *   <li>StateStoreCapability - 状态缓存</li>
 *   <li>EventBusCapability - 事件发布</li>
 *   <li>AuthCapability - 认证上下文</li>
 *   <li>ObservabilityCapability - 可观测性</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface PartnerService {

    // ==================== 基础 CRUD 操作 ====================

    /**
     * 创建合作伙伴
     *
     * <p>创建新的合作伙伴记录，自动生成合作伙伴编码，初始状态为 DRAFT。
     * 创建成功后发布 PartnerCreatedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param request  创建请求
     * @return 创建后的合作伙伴信息
     * @throws IllegalArgumentException 如果必填字段为空
     */
    PartnerDTO create(String tenantId, CreatePartnerRequest request);

    /**
     * 更新合作伙伴信息
     *
     * <p>更新合作伙伴的基本信息、联系信息和资质信息。
     * 更新成功后发布 PartnerUpdatedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @param request  更新请求
     * @return 更新后的合作伙伴信息
     * @throws IllegalArgumentException 如果合作伙伴不存在
     */
    PartnerDTO update(String tenantId, String id, UpdatePartnerRequest request);

    /**
     * 根据ID查询合作伙伴
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @return 合作伙伴信息（可能为空）
     */
    Optional<PartnerDTO> getById(String tenantId, String id);

    /**
     * 根据编码查询合作伙伴
     *
     * @param tenantId    租户ID
     * @param partnerCode 合作伙伴编码
     * @return 合作伙伴信息（可能为空）
     */
    Optional<PartnerDTO> getByCode(String tenantId, String partnerCode);

    /**
     * 查询租户下的所有合作伙伴
     *
     * @param tenantId 租户ID
     * @return 合作伙伴列表
     */
    List<PartnerDTO> listByTenant(String tenantId);

    /**
     * 删除合作伙伴
     *
     * <p>软删除合作伙伴记录（设置 deleted 标志）。
     * 只有 DRAFT 或 TERMINATED 状态的合作伙伴才能删除。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @throws IllegalStateException 如果合作伙伴状态不允许删除
     */
    void delete(String tenantId, String id);

    // ==================== 查询操作 ====================

    /**
     * 根据类型查询合作伙伴
     *
     * @param tenantId    租户ID
     * @param partnerType 合作伙伴类型
     * @return 合作伙伴列表
     */
    List<PartnerDTO> listByType(String tenantId, PartnerType partnerType);

    /**
     * 根据状态查询合作伙伴
     *
     * @param tenantId 租户ID
     * @param status   合作伙伴状态
     * @return 合作伙伴列表
     */
    List<PartnerDTO> listByStatus(String tenantId, PartnerStatus status);

    /**
     * 查询可用的合作伙伴
     *
     * <p>返回状态为 ACTIVE 的合作伙伴列表，可按类型过滤。</p>
     *
     * @param tenantId    租户ID
     * @param partnerType 合作伙伴类型（可选，为 null 时查询所有类型）
     * @return 可用的合作伙伴列表
     */
    List<PartnerDTO> listAvailable(String tenantId, PartnerType partnerType);

    // ==================== 状态变更操作 ====================

    /**
     * 激活合作伙伴
     *
     * <p>将合作伙伴状态从 DRAFT 变更为 ACTIVE。
     * 激活成功后发布 PartnerActivatedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @return 更新后的合作伙伴信息
     * @throws IllegalStateException 如果当前状态不允许激活
     */
    PartnerDTO activate(String tenantId, String id);

    /**
     * 暂停合作伙伴
     *
     * <p>将合作伙伴状态从 ACTIVE 变更为 SUSPENDED。
     * 暂停成功后发布 PartnerSuspendedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @param reason   暂停原因
     * @return 更新后的合作伙伴信息
     * @throws IllegalStateException 如果当前状态不允许暂停
     */
    PartnerDTO suspend(String tenantId, String id, String reason);

    /**
     * 恢复合作伙伴
     *
     * <p>将合作伙伴状态从 SUSPENDED 变更为 ACTIVE。
     * 恢复成功后发布 PartnerResumedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @return 更新后的合作伙伴信息
     * @throws IllegalStateException 如果当前状态不允许恢复
     */
    PartnerDTO resume(String tenantId, String id);

    /**
     * 终止合作伙伴
     *
     * <p>将合作伙伴状态变更为 TERMINATED。此操作不可逆。
     * 终止成功后发布 PartnerTerminatedEvent 事件。</p>
     *
     * @param tenantId 租户ID
     * @param id       合作伙伴ID
     * @param reason   终止原因
     * @return 更新后的合作伙伴信息
     * @throws IllegalStateException 如果当前状态不允许终止
     */
    PartnerDTO terminate(String tenantId, String id, String reason);
}
