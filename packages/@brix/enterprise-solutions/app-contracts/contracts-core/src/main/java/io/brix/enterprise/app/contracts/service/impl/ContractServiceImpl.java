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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.brix.enterprise.app.contracts.dto.*;
import io.brix.enterprise.app.contracts.dto.request.ContractQueryRequest;
import io.brix.enterprise.app.contracts.dto.request.CreateContractRequest;
import io.brix.enterprise.app.contracts.dto.request.SignContractRequest;
import io.brix.enterprise.app.contracts.entity.*;
import io.brix.enterprise.app.contracts.enums.ContractStatus;
import io.brix.enterprise.app.contracts.repository.ContractRepository;
import io.brix.enterprise.app.contracts.repository.ContractTemplateRepository;
import io.brix.enterprise.app.contracts.service.ContractService;
import io.runtime.sdk.context.RuntimeContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 合同服务实现
 *
 * <p>实现合同管理的核心业务逻辑，包括合同创建、签署流程、状态管理等。
 * 通过 RuntimeContext 获取租户上下文和可观测性能力。
 *
 * <p>核心功能：
 * <ul>
 *   <li>合同CRUD操作</li>
 *   <li>签署流程管理</li>
 *   <li>过期合同处理</li>
 *   <li>合同统计</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
public class ContractServiceImpl implements ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ContractRepository contractRepository;
    private final ContractTemplateRepository templateRepository;
    private final RuntimeContext runtimeContext;
    private final ObjectMapper objectMapper;

    /**
     * 构造函数注入依赖
     *
     * @param contractRepository 合同仓储
     * @param templateRepository 模板仓储
     * @param runtimeContext     运行时上下文
     * @param objectMapper       JSON序列化器
     */
    public ContractServiceImpl(ContractRepository contractRepository,
                               ContractTemplateRepository templateRepository,
                               RuntimeContext runtimeContext,
                               ObjectMapper objectMapper) {
        this.contractRepository = contractRepository;
        this.templateRepository = templateRepository;
        this.runtimeContext = runtimeContext;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ContractDTO createContract(CreateContractRequest request) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        String userId = runtimeContext.getAuthContext().getCurrentPrincipal().getName();
        
        log.info("创建合同: tenantId={}, templateId={}", tenantId, request.getTemplateId());

        // 获取模板
        ContractTemplate template = templateRepository.findByIdAndTenantId(request.getTemplateId(), tenantId)
            .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + request.getTemplateId()));

        if (!template.isAvailable()) {
            throw new IllegalArgumentException("模板不可用: " + template.getTemplateCode());
        }

        // 确定使用的版本
        int versionNum = request.getVersion() != null ? request.getVersion() : template.getCurrentVersion();
        TemplateVersion version = templateRepository.findVersionByTemplateAndVersion(template.getId(), versionNum)
            .orElseThrow(() -> new IllegalArgumentException("模板版本不存在: " + versionNum));

        // 生成合同编号
        String date = LocalDate.now().format(DATE_FORMATTER);
        int serial = contractRepository.getNextContractSerial(tenantId, date) + 1;
        String contractNo = String.format("CT-%s-%04d", date, serial);

        // 创建合同
        Contract contract = Contract.create(tenantId, contractNo, template.getId(), version.getId(), userId);
        
        // 设置变量值
        if (request.getVariableValues() != null) {
            try {
                contract.setVariableValues(objectMapper.writeValueAsString(request.getVariableValues()));
            } catch (Exception e) {
                throw new IllegalArgumentException("变量值序列化失败", e);
            }
        }

        // 设置关联案例
        if (request.getCaseId() != null) {
            contract.setCaseId(request.getCaseId());
        }

        // 设置到期日期
        if (request.getExpiresAt() != null) {
            contract.setExpiresAt(request.getExpiresAt());
        }

        // 添加参与方
        if (request.getParties() != null) {
            int order = 0;
            for (CreateContractRequest.PartyRequest partyReq : request.getParties()) {
                int displayOrder = partyReq.getDisplayOrder() != null ? partyReq.getDisplayOrder() : order++;
                ContractParty party = ContractParty.create(
                    partyReq.getPartyType(),
                    partyReq.getPartyId(),
                    partyReq.getPartyName(),
                    partyReq.getPhone(),
                    partyReq.getEmail(),
                    displayOrder
                );
                contract.addParty(party);
            }
        }

        contract = contractRepository.save(contract);

        // 如果设置自动发起签署
        if (Boolean.TRUE.equals(request.getAutoStartSign())) {
            contract.startSign();
            contract = contractRepository.save(contract);
        }

        // 记录指标
        runtimeContext.getObservability().recordMetric(
            "contracts.created",
            1,
            Map.of("tenantId", tenantId, "templateId", template.getId().toString())
        );

        log.info("合同创建成功: contractNo={}", contractNo);
        return toDTO(contract, template);
    }

    @Override
    @Transactional
    public ContractDTO startSign(Long contractId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        
        Contract contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("合同不存在: " + contractId));

        contract.startSign();
        contract = contractRepository.save(contract);

        log.info("合同发起签署: contractNo={}", contract.getContractNo());
        return toDTO(contract, null);
    }

    @Override
    @Transactional
    public ContractDTO sign(Long contractId, SignContractRequest request) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        
        Contract contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("合同不存在: " + contractId));

        // 验证参与方
        boolean isParty = contract.getParties().stream()
            .anyMatch(p -> p.getPartyId().equals(request.getPartyId()));
        if (!isParty) {
            throw new IllegalArgumentException("非合同参与方: " + request.getPartyId());
        }

        // 验证是否已签署
        if (contract.hasPartySigned(request.getPartyId())) {
            throw new IllegalArgumentException("该方已签署: " + request.getPartyId());
        }

        // 创建签署记录
        ContractSignRecord signRecord = ContractSignRecord.create(
            request.getPartyId(),
            request.getSignMethod(),
            request.getSignatureUrl(),
            null, // IP地址由Controller层设置
            null  // UserAgent由Controller层设置
        );
        
        if (request.getExtra() != null) {
            try {
                signRecord.setExtra(objectMapper.writeValueAsString(request.getExtra()));
            } catch (Exception e) {
                log.warn("签署扩展信息序列化失败", e);
            }
        }
        signRecord.setRemark(request.getRemark());

        contract.addSignRecord(signRecord);
        contract = contractRepository.save(contract);

        // 记录指标
        runtimeContext.getObservability().recordMetric(
            "contracts.signed",
            1,
            Map.of("tenantId", tenantId, "status", contract.getStatus().name())
        );

        log.info("合同签署: contractNo={}, partyId={}, newStatus={}", 
            contract.getContractNo(), request.getPartyId(), contract.getStatus());
        return toDTO(contract, null);
    }

    @Override
    @Transactional
    public ContractDTO cancel(Long contractId, String reason) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        
        Contract contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("合同不存在: " + contractId));

        contract.cancel(reason);
        contract = contractRepository.save(contract);

        log.info("合同取消: contractNo={}, reason={}", contract.getContractNo(), reason);
        return toDTO(contract, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContractDTO> findById(Long contractId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.findByIdAndTenantId(contractId, tenantId)
            .map(c -> toDTO(c, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ContractDTO> findByContractNo(String contractNo) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.findByContractNoAndTenantId(contractNo, tenantId)
            .map(c -> toDTO(c, null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> findAll(ContractQueryRequest request) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        
        Pageable pageable = PageRequest.of(
            request.getPageOrDefault(),
            request.getSizeOrDefault(),
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Contract> page = contractRepository.search(
            tenantId,
            request.getContractNo(),
            request.getCaseId(),
            request.getTemplateId(),
            request.getStatus(),
            request.getCreatedBy(),
            pageable
        );

        return page.getContent().stream()
            .map(c -> toDTO(c, null))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> findByCaseId(String caseId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.findByCaseIdAndTenantId(caseId, tenantId).stream()
            .map(c -> toDTO(c, null))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> findByStatus(ContractStatus status) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.findByStatusAndTenantId(status, tenantId).stream()
            .map(c -> toDTO(c, null))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDTO> findByPartyId(String partyId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.findByPartyIdAndTenantId(partyId, tenantId).stream()
            .map(c -> toDTO(c, null))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long contractId) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        
        Contract contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("合同不存在: " + contractId));

        contract.softDelete();
        contractRepository.save(contract);

        log.info("合同删除: contractNo={}", contract.getContractNo());
    }

    @Override
    @Transactional(readOnly = true)
    public long count(ContractStatus status) {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return contractRepository.countByTenantIdAndStatus(tenantId, status);
    }

    @Override
    @Transactional
    public int processExpiredContracts() {
        LocalDate today = LocalDate.now();
        int count = contractRepository.updateExpiredContracts(
            ContractStatus.EXPIRED, 
            ContractStatus.SIGNED, 
            today
        );
        
        if (count > 0) {
            log.info("处理过期合同: count={}", count);
        }
        return count;
    }

    /**
     * 转换为DTO
     */
    private ContractDTO toDTO(Contract contract, ContractTemplate template) {
        ContractDTO.ContractDTOBuilder builder = ContractDTO.builder()
            .id(contract.getId())
            .tenantId(contract.getTenantId())
            .contractNo(contract.getContractNo())
            .caseId(contract.getCaseId())
            .templateId(contract.getTemplateId())
            .versionNumber(null) // 需要从版本获取
            .renderedUrl(contract.getRenderedUrl())
            .status(contract.getStatus())
            .signedAt(contract.getSignedAt())
            .expiresAt(contract.getExpiresAt())
            .createdBy(contract.getCreatedBy())
            .createdAt(contract.getCreatedAt())
            .updatedAt(contract.getUpdatedAt())
            .pendingSignCount(contract.getPendingSignCount())
            .signedCount(contract.getSignRecords().size());

        // 解析变量值
        if (contract.getVariableValues() != null) {
            try {
                Map<String, Object> vars = objectMapper.readValue(
                    contract.getVariableValues(), 
                    new TypeReference<Map<String, Object>>() {}
                );
                builder.variableValues(vars);
            } catch (Exception e) {
                log.warn("变量值解析失败", e);
            }
        }

        // 设置模板信息
        if (template != null) {
            builder.templateName(template.getTemplateName())
                   .contractType(template.getContractType());
        }

        // 转换参与方
        List<ContractPartyDTO> partyDTOs = contract.getParties().stream()
            .map(p -> ContractPartyDTO.builder()
                .id(p.getId())
                .partyType(p.getPartyType())
                .partyId(p.getPartyId())
                .partyName(p.getPartyName())
                .phone(p.getPhone())
                .email(p.getEmail())
                .displayOrder(p.getDisplayOrder())
                .hasSigned(contract.hasPartySigned(p.getPartyId()))
                .build())
            .collect(Collectors.toList());
        builder.parties(partyDTOs);

        // 转换签署记录
        List<SignRecordDTO> signDTOs = contract.getSignRecords().stream()
            .map(r -> {
                SignRecordDTO.SignRecordDTOBuilder recordBuilder = SignRecordDTO.builder()
                    .id(r.getId())
                    .partyId(r.getPartyId())
                    .signMethod(r.getSignMethod())
                    .signatureUrl(r.getSignatureUrl())
                    .signedAt(r.getSignedAt())
                    .ipAddress(r.getIpAddress())
                    .userAgent(r.getUserAgent());
                
                // 查找参与方名称
                contract.getParties().stream()
                    .filter(p -> p.getPartyId().equals(r.getPartyId()))
                    .findFirst()
                    .ifPresent(p -> recordBuilder.partyName(p.getPartyName()));
                
                // 解析扩展信息
                if (r.getExtra() != null) {
                    try {
                        Map<String, Object> extra = objectMapper.readValue(
                            r.getExtra(), 
                            new TypeReference<Map<String, Object>>() {}
                        );
                        recordBuilder.extra(extra);
                    } catch (Exception e) {
                        log.warn("签署扩展信息解析失败", e);
                    }
                }
                
                return recordBuilder.build();
            })
            .collect(Collectors.toList());
        builder.signRecords(signDTOs);

        return builder.build();
    }
}
