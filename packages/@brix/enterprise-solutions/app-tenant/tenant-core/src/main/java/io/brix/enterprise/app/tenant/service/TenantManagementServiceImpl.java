/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.brix.enterprise.app.tenant.domain.TenantMemberRecord;
import io.brix.enterprise.app.tenant.domain.TenantRecord;
import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.dto.TenantMemberDTO;
import io.brix.enterprise.app.tenant.exception.TenantAlreadyExistsException;
import io.brix.enterprise.app.tenant.exception.TenantRecordNotFoundException;
import io.brix.enterprise.app.tenant.repository.TenantMemberRecordRepository;
import io.brix.enterprise.app.tenant.repository.TenantRecordRepository;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;

/**
 * Transactional tenant management service backed by app-tenant owned storage.
 *
 * <p>This service owns only app-tenant records. It does not call Host code,
 * platform-tenant repositories, other plugin repositories, or infrastructure
 * clients.</p>
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@Service
public class TenantManagementServiceImpl implements TenantManagementService {

    private static final String MEMBER_TYPE_OWNER = "OWNER";

    private final TenantRecordRepository tenantRecordRepository;
    private final TenantMemberRecordRepository tenantMemberRecordRepository;

    /**
     * Creates the service.
     *
     * @param tenantRecordRepository tenant repository
     * @param tenantMemberRecordRepository tenant member repository
     */
    public TenantManagementServiceImpl(
            TenantRecordRepository tenantRecordRepository,
            TenantMemberRecordRepository tenantMemberRecordRepository) {
        this.tenantRecordRepository = tenantRecordRepository;
        this.tenantMemberRecordRepository = tenantMemberRecordRepository;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TenantDTO createTenant(CreateTenantRequest request) {
        CreateTenantRequest normalized = normalizeCreateRequest(request);
        if (tenantRecordRepository.existsByCode(normalized.getCode())) {
            throw new TenantAlreadyExistsException(normalized.getCode());
        }
        TenantRecord tenant = tenantRecordRepository.save(new TenantRecord(
            normalized.getCode(),
            normalized.getName(),
            normalized.getOwnerIdentityId(),
            normalized.getContactEmail()));
        tenantMemberRecordRepository.save(new TenantMemberRecord(
            tenant.getId(),
            normalized.getOwnerIdentityId(),
            null,
            normalized.getContactEmail(),
            MEMBER_TYPE_OWNER));
        return toDto(tenant);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public TenantDTO getTenantById(Long tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }
        return tenantRecordRepository.findById(tenantId)
            .map(this::toDto)
            .orElseThrow(() -> new TenantRecordNotFoundException("id=" + tenantId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public TenantDTO getTenantByCode(String code) {
        String normalizedCode = normalizeCode(code);
        return tenantRecordRepository.findByCode(normalizedCode)
            .map(this::toDto)
            .orElseThrow(() -> new TenantRecordNotFoundException("code=" + normalizedCode));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<TenantDTO> listTenants() {
        return tenantRecordRepository.findAllByOrderByCodeAsc().stream()
            .map(this::toDto)
            .toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TenantDTO activateTenant(Long tenantId) {
        TenantRecord tenant = tenantRecordRepository.findById(requireTenantId(tenantId))
            .orElseThrow(() -> new TenantRecordNotFoundException("id=" + tenantId));
        tenant.activate();
        return toDto(tenantRecordRepository.save(tenant));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TenantDTO suspendTenant(Long tenantId) {
        TenantRecord tenant = tenantRecordRepository.findById(requireTenantId(tenantId))
            .orElseThrow(() -> new TenantRecordNotFoundException("id=" + tenantId));
        tenant.suspend();
        return toDto(tenantRecordRepository.save(tenant));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<TenantMemberDTO> listMembers(Long tenantId) {
        Long id = requireTenantId(tenantId);
        if (!tenantRecordRepository.existsById(id)) {
            throw new TenantRecordNotFoundException("id=" + id);
        }
        return tenantMemberRecordRepository.findByTenantIdOrderByIdAsc(id).stream()
            .map(this::toMemberDto)
            .toList();
    }

    private CreateTenantRequest normalizeCreateRequest(CreateTenantRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request must not be null");
        }
        String code = normalizeCode(request.getCode());
        String name = normalizeText(request.getName(), "name");
        Long ownerIdentityId = request.getOwnerIdentityId();
        if (ownerIdentityId == null) {
            throw new IllegalArgumentException("ownerIdentityId must not be null");
        }
        CreateTenantRequest normalized = new CreateTenantRequest();
        normalized.setCode(code);
        normalized.setName(name);
        normalized.setOwnerIdentityId(ownerIdentityId);
        normalized.setContactEmail(normalizeOptionalText(request.getContactEmail()));
        return normalized;
    }

    private Long requireTenantId(Long tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId must not be null");
        }
        return tenantId;
    }

    private String normalizeCode(String code) {
        String normalized = normalizeText(code, "code").toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[a-z0-9][a-z0-9-]*[a-z0-9]$")) {
            throw new IllegalArgumentException("code must be lowercase alphanumeric with hyphens");
        }
        if (normalized.length() < 2 || normalized.length() > 64) {
            throw new IllegalArgumentException("code length must be between 2 and 64");
        }
        return normalized;
    }

    private String normalizeText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private TenantDTO toDto(TenantRecord tenant) {
        return new TenantDTO(
            tenant.getId(),
            tenant.getCode(),
            tenant.getName(),
            tenant.getStatus().name(),
            tenant.getContactEmail(),
            tenant.getCreatedAt(),
            tenant.getUpdatedAt());
    }

    private TenantMemberDTO toMemberDto(TenantMemberRecord member) {
        TenantMemberDTO dto = new TenantMemberDTO();
        dto.setId(member.getId());
        dto.setTenantId(member.getTenantId());
        dto.setIdentityId(member.getIdentityId());
        dto.setDisplayName(member.getDisplayName());
        dto.setEmail(member.getEmail());
        dto.setMemberType(member.getMemberType());
        dto.setStatus(member.getStatus());
        dto.setJoinedAt(member.getJoinedAt());
        return dto;
    }
}
