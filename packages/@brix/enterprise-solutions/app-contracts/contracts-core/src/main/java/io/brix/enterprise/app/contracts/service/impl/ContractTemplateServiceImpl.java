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
package io.brix.enterprise.app.contracts.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.brix.enterprise.app.contracts.dto.ContractTemplateDTO;
import io.brix.enterprise.app.contracts.dto.TemplateVariableDTO;
import io.brix.enterprise.app.contracts.dto.TemplateVersionDTO;
import io.brix.enterprise.app.contracts.dto.request.CreateTemplateRequest;
import io.brix.enterprise.app.contracts.dto.request.PublishVersionRequest;
import io.brix.enterprise.app.contracts.entity.ContractTemplate;
import io.brix.enterprise.app.contracts.entity.TemplateVersion;
import io.brix.enterprise.app.contracts.enums.ContractType;
import io.brix.enterprise.app.contracts.repository.ContractTemplateRepository;
import io.brix.enterprise.app.contracts.service.ContractTemplateService;
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
 * 合同模板服务实现
 *
 * <p>实现合同模板管理的核心业务逻辑，包括模板创建、版本管理、查询等。
 * 通过 RuntimeContext 获取租户上下文和可观测性能力。
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
public class ContractTemplateServiceImpl implements ContractTemplateService {

    private static final Logger log = LoggerFactory.getLogger(ContractTemplateServiceImpl.class);

    private final ContractTemplateRepository templateRepository;
    private final RuntimeContext runtimeContext;
    private final ObjectMapper objectMapper;

    /**
     * 构造函数注入依赖
     *
     * @param templateRepository 模板仓储
     * @param runtimeContext     运行时上下文
     * @param objectMapper       JSON序列化器
     */
    public ContractTemplateServiceImpl(ContractTemplateRepository templateRepository,
                                       RuntimeContext runtimeContext,
                                       ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.runtimeContext = runtimeContext;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ContractTemplateDTO createTemplate(CreateTemplateRequest request) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        String userId = runtimeContext.getAuthContext().getCurrentPrincipal().getName();

        log.info("创建合同模板: tenantId={}, code={}", tenantId, request.getTemplateCode());

        // 检查编码是否存在
        if (templateRepository.existsByCodeAndTenantId(request.getTemplateCode(), tenantId)) {
            throw new IllegalArgumentException("模板编码已存在: " + request.getTemplateCode());
        }

        // 创建模板
        ContractTemplate template = ContractTemplate.create(
            tenantId,
            request.getTemplateCode(),
            request.getTemplateName(),
            request.getContractType(),
            userId
        );
        template.setDescription(request.getDescription());

        // 创建第一个版本
        String variablesJson = null;
        if (request.getVariables() != null && !request.getVariables().isEmpty()) {
            try {
                variablesJson = objectMapper.writeValueAsString(request.getVariables());
            } catch (Exception e) {
                throw new IllegalArgumentException("变量定义序列化失败", e);
            }
        }

        TemplateVersion version = TemplateVersion.create(
            request.getFileUrl(),
            request.getFileType(),
            variablesJson,
            "初始版本",
            userId
        );
        template.addVersion(version);

        template = templateRepository.save(template);

        // 记录指标
        runtimeContext.getObservability().recordMetric(
            "contracts.templates.created",
            1,
            Map.of("tenantId", tenantId, "type", request.getContractType().name())
        );

        log.info("合同模板创建成功: code={}", request.getTemplateCode());
        return toDTO(template);
    }

    @Override
    @Transactional
    public ContractTemplateDTO updateTemplate(Long templateId, String name, String description) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        if (name != null && !name.isBlank()) {
            template.setTemplateName(name);
        }
        if (description != null) {
            template.setDescription(description);
        }

        template = templateRepository.save(template);
        log.info("合同模板更新: id={}", templateId);
        return toDTO(template);
    }

    @Override
    @Transactional
    public TemplateVersionDTO publishVersion(Long templateId, PublishVersionRequest request) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        String userId = runtimeContext.getAuthContext().getCurrentPrincipal().getName();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        // 序列化变量定义
        String variablesJson = null;
        if (request.getVariables() != null && !request.getVariables().isEmpty()) {
            try {
                variablesJson = objectMapper.writeValueAsString(request.getVariables());
            } catch (Exception e) {
                throw new IllegalArgumentException("变量定义序列化失败", e);
            }
        }

        // 创建新版本
        TemplateVersion version = TemplateVersion.create(
            request.getFileUrl(),
            request.getFileType(),
            variablesJson,
            request.getChangeLog(),
            userId
        );
        template.addVersion(version);

        template = templateRepository.save(template);

        // 记录指标
        runtimeContext.getObservability().recordMetric(
            "contracts.templates.versions.published",
            1,
            Map.of("tenantId", tenantId, "templateId", templateId.toString())
        );

        log.info("模板新版本发布: templateId={}, version={}", templateId, version.getVersionNumber());
        return toVersionDTO(version, true);
    }

    @Override
    @Transactional
    public ContractTemplateDTO switchVersion(Long templateId, Integer versionNumber) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        template.switchToVersion(versionNumber);
        template = templateRepository.save(template);

        log.info("模板版本切换: templateId={}, version={}", templateId, versionNumber);
        return toDTO(template);
    }

    @Override
    @Transactional
    public ContractTemplateDTO enable(Long templateId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        template.enable();
        template = templateRepository.save(template);

        log.info("模板启用: templateId={}", templateId);
        return toDTO(template);
    }

    @Override
    @Transactional
    public ContractTemplateDTO disable(Long templateId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        template.disable();
        template = templateRepository.save(template);

        log.info("模板禁用: templateId={}", templateId);
        return toDTO(template);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContractTemplateDTO> findById(Long templateId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return templateRepository.findByIdAndTenantId(templateId, tenantId)
            .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContractTemplateDTO> findByCode(String templateCode) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return templateRepository.findByCodeAndTenantId(templateCode, tenantId)
            .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractTemplateDTO> findAll(boolean activeOnly) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        List<ContractTemplate> templates = activeOnly 
            ? templateRepository.findActiveByTenantId(tenantId)
            : templateRepository.findAllByTenantId(tenantId);
        return templates.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractTemplateDTO> findByType(ContractType contractType) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return templateRepository.findByTypeAndTenantId(contractType, tenantId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateVersionDTO> findVersions(Long templateId) {
        return templateRepository.findVersionsByTemplateId(templateId).stream()
            .map(v -> {
                ContractTemplate template = v.getTemplate();
                boolean isCurrent = template.getCurrentVersion().equals(v.getVersionNumber());
                return toVersionDTO(v, isCurrent);
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long templateId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();

        ContractTemplate template = templateRepository.findByIdAndTenantId(templateId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateId));

        // 检查是否被使用
        if (templateRepository.isTemplateInUse(templateId)) {
            throw new IllegalStateException("模板已被使用，无法删除");
        }

        template.softDelete();
        templateRepository.save(template);

        log.info("模板删除: templateId={}", templateId);
    }

    @Override
    @Transactional(readOnly = true)
    public long count(boolean activeOnly) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return templateRepository.countByTenantId(tenantId, activeOnly);
    }

    /**
     * 转换为DTO
     */
    private ContractTemplateDTO toDTO(ContractTemplate template) {
        return ContractTemplateDTO.builder()
            .id(template.getId())
            .tenantId(template.getTenantId())
            .templateCode(template.getTemplateCode())
            .templateName(template.getTemplateName())
            .contractType(template.getContractType())
            .description(template.getDescription())
            .currentVersion(template.getCurrentVersion())
            .isActive(template.getIsActive())
            .createdBy(template.getCreatedBy())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }

    /**
     * 转换版本为DTO
     */
    private TemplateVersionDTO toVersionDTO(TemplateVersion version, boolean isCurrent) {
        TemplateVersionDTO.TemplateVersionDTOBuilder builder = TemplateVersionDTO.builder()
            .id(version.getId())
            .templateId(version.getTemplate().getId())
            .versionNumber(version.getVersionNumber())
            .fileUrl(version.getFileUrl())
            .fileType(version.getFileType())
            .changeLog(version.getChangeLog())
            .isCurrent(isCurrent)
            .publishedBy(version.getPublishedBy())
            .publishedAt(version.getPublishedAt())
            .createdAt(version.getCreatedAt());

        // 解析变量定义
        if (version.getVariables() != null) {
            try {
                List<TemplateVariableDTO> variables = objectMapper.readValue(
                    version.getVariables(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, TemplateVariableDTO.class)
                );
                builder.variables(variables);
            } catch (Exception e) {
                log.warn("变量定义解析失败", e);
            }
        }

        return builder.build();
    }
}
