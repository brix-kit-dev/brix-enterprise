/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service.impl;

import io.brix.enterprise.app.compliance.dto.CreateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.dto.ForbiddenWordDTO;
import io.brix.enterprise.app.compliance.dto.UpdateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.entity.ForbiddenWordEntity;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.brix.enterprise.app.compliance.repository.ForbiddenWordRepository;
import io.brix.enterprise.app.compliance.service.ForbiddenWordService;
import io.runtime.sdk.context.RuntimeContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.Objects;

/**
 * Production implementation of {@link ForbiddenWordService}.
 *
 * <p>Manages CRUD operations and enable/disable toggling for
 * forbidden word rules used by the compliance checking engine.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Service
@Transactional
public class ForbiddenWordServiceImpl implements ForbiddenWordService {

    private final ForbiddenWordRepository repository;
    private final RuntimeContext runtimeContext;

    public ForbiddenWordServiceImpl(ForbiddenWordRepository repository,
                                     RuntimeContext runtimeContext) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.runtimeContext = Objects.requireNonNull(runtimeContext, "runtimeContext must not be null");
    }

    @Override
    public ForbiddenWordDTO create(CreateForbiddenWordRequest request) {
        ForbiddenWordEntity entity = new ForbiddenWordEntity();
        entity.setWord(request.word());
        entity.setCategory(request.category());
        entity.setSeverity(request.severity());
        entity.setReason(request.reason());
        entity.setCaseSensitive(request.caseSensitive() != null ? request.caseSensitive() : false);
        entity.setWholeWordOnly(request.wholeWordOnly() != null ? request.wholeWordOnly() : false);
        entity.setPattern(request.pattern());
        entity.setEnabled(request.enabled() != null ? request.enabled() : true);
        entity.setCreatedBy(getCurrentUserId());

        if (request.alternatives() != null) {
            entity.setAlternatives(List.copyOf(request.alternatives()));
        }

        return toDTO(repository.save(entity));
    }

    @Override
    public ForbiddenWordDTO update(String id, UpdateForbiddenWordRequest request) {
        ForbiddenWordEntity entity = findEntityById(id);

        if (request.word() != null) entity.setWord(request.word());
        if (request.category() != null) entity.setCategory(request.category());
        if (request.severity() != null) entity.setSeverity(request.severity());
        if (request.reason() != null) entity.setReason(request.reason());
        if (request.caseSensitive() != null) entity.setCaseSensitive(request.caseSensitive());
        if (request.wholeWordOnly() != null) entity.setWholeWordOnly(request.wholeWordOnly());
        if (request.pattern() != null) entity.setPattern(request.pattern());
        if (request.enabled() != null) entity.setEnabled(request.enabled());
        if (request.alternatives() != null) entity.setAlternatives(List.copyOf(request.alternatives()));

        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ForbiddenWordDTO findById(String id) {
        return toDTO(findEntityById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ForbiddenWordDTO> query(String word, ForbiddenWordCategory category,
                                         ForbiddenWordSeverity severity,
                                         Boolean enabled, Pageable pageable) {
        return repository.findByFilters(word, category, severity, enabled, pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ForbiddenWordDTO> findAllEnabled() {
        return repository.findByEnabledTrue().stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public void delete(String id) {
        ForbiddenWordEntity entity = findEntityById(id);
        repository.delete(entity);
    }

    @Override
    public ForbiddenWordDTO setEnabled(String id, boolean enabled) {
        ForbiddenWordEntity entity = findEntityById(id);
        entity.setEnabled(enabled);
        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    // ==================== Private Helpers ====================

    private ForbiddenWordEntity findEntityById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ForbiddenWord not found with id: " + id));
    }

    private String getCurrentUserId() {
        Principal principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        return principal != null ? principal.getName() : "system";
    }

    private ForbiddenWordDTO toDTO(ForbiddenWordEntity entity) {
        return new ForbiddenWordDTO(
                entity.getId(),
                entity.getWord(),
                entity.getCategory(),
                entity.getSeverity(),
                entity.getReason(),
                entity.getAlternatives() == null ? List.of() : List.copyOf(entity.getAlternatives()),
                entity.isCaseSensitive(),
                entity.isWholeWordOnly(),
                entity.getPattern(),
                entity.isEnabled(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }
}
