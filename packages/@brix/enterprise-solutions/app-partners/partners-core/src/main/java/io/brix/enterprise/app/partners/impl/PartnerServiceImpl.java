/*
 * Copyright 2026 Brix Platform
 *
 * 合作伙伴服务实现
 */
package io.brix.enterprise.app.partners.impl;

import io.brix.enterprise.app.partners.dto.CreatePartnerRequest;
import io.brix.enterprise.app.partners.dto.PartnerDTO;
import io.brix.enterprise.app.partners.dto.UpdatePartnerRequest;
import io.brix.enterprise.app.partners.entity.Partner;
import io.brix.enterprise.app.partners.enums.PartnerStatus;
import io.brix.enterprise.app.partners.enums.PartnerType;
import io.brix.enterprise.app.partners.repository.PartnerRepository;
import io.brix.enterprise.app.partners.service.PartnerService;
import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.capability.StateStoreCapability;
import io.runtime.sdk.context.RuntimeContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 合作伙伴服务实现
 *
 * <p>基于 Runtime Shell v3.0 Capability Contract 架构实现。
 * 通过 RuntimeContext 获取运行时能力，包括状态存储、事件发布、可观测性等。</p>
 *
 * <h3>核心特性</h3>
 * <ul>
 *   <li>多租户数据隔离</li>
 *   <li>状态缓存支持</li>
 *   <li>领域事件发布</li>
 *   <li>可观测性埋点</li>
 * </ul>
 *
 * <h3>缓存策略</h3>
 * <ul>
 *   <li>合作伙伴信息按编码缓存，Key 格式：partner:{tenantId}:{partnerCode}</li>
 *   <li>列表查询不缓存，保证实时性</li>
 *   <li>更新/删除时清除相关缓存</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
@Transactional
public class PartnerServiceImpl implements PartnerService {

    private static final Logger log = LoggerFactory.getLogger(PartnerServiceImpl.class);

    /**
     * 缓存 Key 前缀
     */
    private static final String CACHE_KEY_PREFIX = "partner:";

    private final PartnerRepository partnerRepository;
    private final RuntimeContext runtimeContext;

    /**
     * 构造函数
     *
     * @param partnerRepository 合作伙伴仓储
     * @param runtimeContext    运行时上下文
     */
    public PartnerServiceImpl(PartnerRepository partnerRepository, RuntimeContext runtimeContext) {
        this.partnerRepository = partnerRepository;
        this.runtimeContext = runtimeContext;
    }

    // ==================== 基础 CRUD 操作 ====================

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO create(String tenantId, CreatePartnerRequest request) {
        log.info("创建合作伙伴: tenantId={}, name={}, type={}", tenantId, request.getName(), request.getPartnerType());

        // 生成合作伙伴编码
        String partnerCode = generatePartnerCode(tenantId, request.getPartnerType());

        // 检查编码唯一性
        if (partnerRepository.existsByPartnerCode(partnerCode)) {
            throw new IllegalArgumentException("合作伙伴编码已存在: " + partnerCode);
        }

        // 创建实体
        Partner partner = Partner.builder()
                .tenantId(tenantId)
                .partnerCode(partnerCode)
                .name(request.getName())
                .shortName(request.getShortName())
                .partnerType(request.getPartnerType())
                .status(PartnerStatus.DRAFT)
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .address(request.getAddress())
                .description(request.getDescription())
                .serviceArea(request.getServiceArea())
                .qualifications(request.getQualifications())
                .build();

        // 保存
        Partner saved = partnerRepository.save(partner);
        log.info("合作伙伴创建成功: id={}, code={}", saved.getId(), saved.getPartnerCode());

        // 发布事件
        publishEvent("PartnerCreated", Map.of(
                "partnerId", saved.getId(),
                "partnerCode", saved.getPartnerCode(),
                "partnerType", saved.getPartnerType().name(),
                "tenantId", tenantId
        ));

        // 记录指标
        recordMetric("partner.created", 1, Map.of("type", request.getPartnerType().name()));

        return toDTO(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO update(String tenantId, Long id, UpdatePartnerRequest request) {
        log.info("更新合作伙伴: tenantId={}, id={}", tenantId, id);

        Partner partner = findPartnerById(tenantId, id);

        // 更新字段
        partner.setName(request.getName());
        partner.setShortName(request.getShortName());
        partner.setContactName(request.getContactName());
        partner.setContactPhone(request.getContactPhone());
        partner.setContactEmail(request.getContactEmail());
        partner.setAddress(request.getAddress());
        partner.setDescription(request.getDescription());
        partner.setServiceArea(request.getServiceArea());
        if (request.getQualifications() != null) {
            partner.setQualifications(request.getQualifications());
        }

        // 保存
        Partner saved = partnerRepository.save(partner);
        log.info("合作伙伴更新成功: id={}", saved.getId());

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerUpdated", Map.of(
                "partnerId", saved.getId(),
                "partnerCode", saved.getPartnerCode(),
                "tenantId", tenantId
        ));

        return toDTO(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<PartnerDTO> getById(String tenantId, Long id) {
        return partnerRepository.findByTenantIdAndId(tenantId, id)
                .map(this::toDTO);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<PartnerDTO> getByCode(String tenantId, String partnerCode) {
        // 先查缓存
        StateStoreCapability stateStore = runtimeContext.getStateStore();
        String cacheKey = buildCacheKey(tenantId, partnerCode);

        Optional<PartnerDTO> cached = stateStore.get(cacheKey, PartnerDTO.class);
        if (cached.isPresent()) {
            log.debug("缓存命中: {}", cacheKey);
            return cached;
        }

        // 查数据库
        Optional<Partner> partnerOpt = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode);
        if (partnerOpt.isPresent()) {
            PartnerDTO dto = toDTO(partnerOpt.get());
            // 放入缓存
            stateStore.put(cacheKey, dto);
            return Optional.of(dto);
        }

        return Optional.empty();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<PartnerDTO> listByTenant(String tenantId) {
        return partnerRepository.findAllByTenantId(tenantId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void delete(String tenantId, Long id) {
        log.info("删除合作伙伴: tenantId={}, id={}", tenantId, id);

        Partner partner = findPartnerById(tenantId, id);

        if (!partner.canDelete()) {
            throw new IllegalStateException(
                    String.format("当前状态 %s 不允许删除合作伙伴", partner.getStatus()));
        }

        // 软删除
        partner.setDeleted(true);
        partnerRepository.save(partner);

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerDeleted", Map.of(
                "partnerId", id,
                "partnerCode", partner.getPartnerCode(),
                "tenantId", tenantId
        ));

        log.info("合作伙伴删除成功: id={}", id);
    }

    // ==================== 查询操作 ====================

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<PartnerDTO> listByType(String tenantId, PartnerType partnerType) {
        return partnerRepository.findByTenantIdAndPartnerType(tenantId, partnerType).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<PartnerDTO> listByStatus(String tenantId, PartnerStatus status) {
        return partnerRepository.findByTenantIdAndStatus(tenantId, status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<PartnerDTO> listAvailable(String tenantId, PartnerType partnerType) {
        List<Partner> partners;
        if (partnerType != null) {
            partners = partnerRepository.findAvailableByTenantIdAndType(tenantId, partnerType);
        } else {
            partners = partnerRepository.findAvailableByTenantId(tenantId);
        }
        return partners.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== 状态变更操作 ====================

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO activate(String tenantId, Long id) {
        log.info("激活合作伙伴: tenantId={}, id={}", tenantId, id);

        Partner partner = findPartnerById(tenantId, id);
        partner.activate();
        Partner saved = partnerRepository.save(partner);

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerActivated", Map.of(
                "partnerId", id,
                "partnerCode", partner.getPartnerCode(),
                "tenantId", tenantId
        ));

        log.info("合作伙伴激活成功: id={}", id);
        return toDTO(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO suspend(String tenantId, Long id, String reason) {
        log.info("暂停合作伙伴: tenantId={}, id={}, reason={}", tenantId, id, reason);

        Partner partner = findPartnerById(tenantId, id);
        partner.suspend();
        Partner saved = partnerRepository.save(partner);

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerSuspended", Map.of(
                "partnerId", id,
                "partnerCode", partner.getPartnerCode(),
                "tenantId", tenantId,
                "reason", reason != null ? reason : ""
        ));

        log.info("合作伙伴暂停成功: id={}", id);
        return toDTO(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO resume(String tenantId, Long id) {
        log.info("恢复合作伙伴: tenantId={}, id={}", tenantId, id);

        Partner partner = findPartnerById(tenantId, id);
        partner.resume();
        Partner saved = partnerRepository.save(partner);

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerResumed", Map.of(
                "partnerId", id,
                "partnerCode", partner.getPartnerCode(),
                "tenantId", tenantId
        ));

        log.info("合作伙伴恢复成功: id={}", id);
        return toDTO(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PartnerDTO terminate(String tenantId, Long id, String reason) {
        log.info("终止合作伙伴: tenantId={}, id={}, reason={}", tenantId, id, reason);

        Partner partner = findPartnerById(tenantId, id);
        partner.terminate();
        Partner saved = partnerRepository.save(partner);

        // 清除缓存
        clearCache(tenantId, partner.getPartnerCode());

        // 发布事件
        publishEvent("PartnerTerminated", Map.of(
                "partnerId", id,
                "partnerCode", partner.getPartnerCode(),
                "tenantId", tenantId,
                "reason", reason != null ? reason : ""
        ));

        log.info("合作伙伴终止成功: id={}", id);
        return toDTO(saved);
    }

    // ==================== 私有方法 ====================

    /**
     * 根据 ID 查找合作伙伴，不存在时抛出异常
     */
    private Partner findPartnerById(String tenantId, Long id) {
        return partnerRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("合作伙伴不存在: " + id));
    }

    /**
     * 生成合作伙伴编码
     * <p>格式：{类型前缀}-{租户简码}-{序号}</p>
     */
    private String generatePartnerCode(String tenantId, PartnerType partnerType) {
        String prefix = switch (partnerType) {
            case HOSPITAL -> "HOSP";
            case HOTEL -> "HOTL";
            case TRANSPORT -> "TRNS";
            case TRANSLATION -> "TRAN";
            case OTHER -> "OTHR";
        };

        // 获取租户简码（取前 4 位或全部）
        String tenantPrefix = tenantId.length() > 4 ? tenantId.substring(0, 4).toUpperCase() : tenantId.toUpperCase();

        // 获取序号
        long count = partnerRepository.countByTenantIdAndPartnerType(tenantId, partnerType);
        String sequence = String.format("%05d", count + 1);

        return String.format("%s-%s-%s", prefix, tenantPrefix, sequence);
    }

    /**
     * 构建缓存 Key
     */
    private String buildCacheKey(String tenantId, String partnerCode) {
        return CACHE_KEY_PREFIX + tenantId + ":" + partnerCode;
    }

    /**
     * 清除缓存
     */
    private void clearCache(String tenantId, String partnerCode) {
        StateStoreCapability stateStore = runtimeContext.getStateStore();
        String cacheKey = buildCacheKey(tenantId, partnerCode);
        stateStore.remove(cacheKey);
        log.debug("缓存已清除: {}", cacheKey);
    }

    /**
     * 发布领域事件（简化实现：仅记录日志）
     * <p>TODO: 待后续创建完整的 DomainEvent 子类后启用事件发布</p>
     */
    private void publishEvent(String eventType, Map<String, Object> payload) {
        // 目前仅记录日志，后续可扩展为完整的领域事件发布
        log.info("领域事件: type={}, payload={}", eventType, payload);
    }

    /**
     * 记录业务指标
     */
    private void recordMetric(String metricName, double value, Map<String, String> tags) {
        try {
            ObservabilityCapability observability = runtimeContext.getObservability();
            observability.recordMetric(metricName, value, tags);
        } catch (Exception e) {
            log.warn("指标记录失败: {}", metricName, e);
        }
    }

    /**
     * 实体转 DTO
     */
    private PartnerDTO toDTO(Partner partner) {
        return PartnerDTO.builder()
                .id(partner.getId())
                .tenantId(partner.getTenantId())
                .partnerCode(partner.getPartnerCode())
                .name(partner.getName())
                .shortName(partner.getShortName())
                .partnerType(partner.getPartnerType())
                .status(partner.getStatus())
                .contactName(partner.getContactName())
                .contactPhone(partner.getContactPhone())
                .contactEmail(partner.getContactEmail())
                .address(partner.getAddress())
                .description(partner.getDescription())
                .serviceArea(partner.getServiceArea())
                .qualifications(partner.getQualifications())
                .createdAt(partner.getCreatedAt())
                .updatedAt(partner.getUpdatedAt())
                .createdBy(partner.getCreatedBy())
                .updatedBy(partner.getUpdatedBy())
                .build();
    }
}
