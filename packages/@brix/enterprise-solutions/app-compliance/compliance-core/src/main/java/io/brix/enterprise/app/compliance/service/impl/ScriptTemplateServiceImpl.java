/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service.impl;

import io.brix.enterprise.app.compliance.dto.CreateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.dto.ScriptTemplateDTO;
import io.brix.enterprise.app.compliance.dto.ScriptVariableDTO;
import io.brix.enterprise.app.compliance.dto.UpdateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.entity.ScriptTemplateEntity;
import io.brix.enterprise.app.compliance.entity.ScriptVariableEmbeddable;
import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import io.brix.enterprise.app.compliance.event.ScriptTemplatePublishedEvent;
import io.brix.enterprise.app.compliance.repository.ScriptTemplateRepository;
import io.brix.enterprise.app.compliance.service.ScriptTemplateService;
import io.runtime.sdk.context.RuntimeContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Production implementation of {@link ScriptTemplateService}.
 *
 * <p>Manages the full lifecycle of script templates including creation,
 * update, review, publication, deprecation, and archival. Publishes
 * {@link ScriptTemplatePublishedEvent} via the Runtime Shell EventBus
 * upon template approval.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Service
@Transactional
public class ScriptTemplateServiceImpl implements ScriptTemplateService {

    private final ScriptTemplateRepository repository;
    private final RuntimeContext runtimeContext;

    /**
     * Constructs the service with required dependencies.
     *
     * @param repository     the script template JPA repository
     * @param runtimeContext the runtime context for EventBus and AuthContext access
     */
    public ScriptTemplateServiceImpl(ScriptTemplateRepository repository,
                                      RuntimeContext runtimeContext) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.runtimeContext = Objects.requireNonNull(runtimeContext, "runtimeContext must not be null");
    }

    @Override
    public ScriptTemplateDTO create(CreateScriptTemplateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Template code already exists: " + request.code());
        }

        String tenantId = requireTenantId();
        ScriptTemplateEntity entity = new ScriptTemplateEntity();
        entity.setTenantId(tenantId);
        entity.setCode(request.code());
        entity.setName(request.name());
        entity.setCategory(request.category());
        entity.setScenario(request.scenario());
        entity.setContent(request.content());
        entity.setGuidance(request.guidance());
        entity.setExpectedOutcome(request.expectedOutcome());
        entity.setStatus(ScriptTemplateStatus.DRAFT);
        entity.setVersion("1.0.0");
        entity.setUsageCount(0L);
        entity.setCreatedBy(getCurrentUserId());

        if (request.variables() != null) {
            entity.setVariables(request.variables().stream()
                    .map(v -> new ScriptVariableEmbeddable(v.key(), v.label(),
                            v.description(), v.defaultValue(), v.order()))
                    .toList());
        }
        if (request.tags() != null) {
            entity.setTags(List.copyOf(request.tags()));
        }
        if (request.productIds() != null) {
            entity.setProductIds(List.copyOf(request.productIds()));
        }

        return toDTO(repository.save(entity));
    }

    @Override
    public ScriptTemplateDTO update(String id, UpdateScriptTemplateRequest request) {
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.DRAFT, "Only DRAFT templates can be updated");

        if (request.name() != null) entity.setName(request.name());
        if (request.category() != null) entity.setCategory(request.category());
        if (request.scenario() != null) entity.setScenario(request.scenario());
        if (request.content() != null) entity.setContent(request.content());
        if (request.guidance() != null) entity.setGuidance(request.guidance());
        if (request.expectedOutcome() != null) entity.setExpectedOutcome(request.expectedOutcome());
        if (request.variables() != null) {
            entity.setVariables(request.variables().stream()
                    .map(v -> new ScriptVariableEmbeddable(v.key(), v.label(),
                            v.description(), v.defaultValue(), v.order()))
                    .toList());
        }
        if (request.tags() != null) entity.setTags(List.copyOf(request.tags()));
        if (request.productIds() != null) entity.setProductIds(List.copyOf(request.productIds()));

        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ScriptTemplateDTO findById(String id) {
        return toDTO(findEntityById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ScriptTemplateDTO> query(String name, ScriptCategory category,
                                          ScriptScenario scenario,
                                          ScriptTemplateStatus status,
                                          Pageable pageable) {
        return repository.findByFilters(name, category, scenario, status, pageable)
                .map(this::toDTO);
    }

    @Override
    public void delete(String id) {
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.DRAFT, "Only DRAFT templates can be deleted");
        repository.delete(entity);
    }

    @Override
    public ScriptTemplateDTO submitForReview(String id) {
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.DRAFT, "Only DRAFT templates can be submitted for review");
        entity.setStatus(ScriptTemplateStatus.PENDING_REVIEW);
        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    @Override
    public ScriptTemplateDTO approveAndPublish(String id, String reviewComments) {
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.PENDING_REVIEW,
                "Only PENDING_REVIEW templates can be approved");

        String reviewerId = getCurrentUserId();
        entity.setStatus(ScriptTemplateStatus.PUBLISHED);
        entity.setReviewComments(reviewComments);
        entity.setReviewedBy(reviewerId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setUpdatedBy(reviewerId);

        ScriptTemplateEntity saved = repository.save(entity);

        // Publish integration event via Runtime Shell EventBus
        runtimeContext.getEventBus().publishIntegration(new ScriptTemplatePublishedEvent(
                saved.getId(), saved.getCode(), saved.getName(),
            entity.getVersion(), reviewerId, saved.getTenantId()));

        return toDTO(saved);
    }

    @Override
    public ScriptTemplateDTO reject(String id, String reviewComments) {
        Objects.requireNonNull(reviewComments, "Review comments are required for rejection");
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.PENDING_REVIEW,
                "Only PENDING_REVIEW templates can be rejected");

        String reviewerId = getCurrentUserId();
        entity.setStatus(ScriptTemplateStatus.DRAFT);
        entity.setReviewComments(reviewComments);
        entity.setReviewedBy(reviewerId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setUpdatedBy(reviewerId);

        return toDTO(repository.save(entity));
    }

    @Override
    public ScriptTemplateDTO deprecate(String id) {
        ScriptTemplateEntity entity = findEntityById(id);
        requireStatus(entity, ScriptTemplateStatus.PUBLISHED,
                "Only PUBLISHED templates can be deprecated");

        entity.setStatus(ScriptTemplateStatus.DEPRECATED);
        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    @Override
    public ScriptTemplateDTO archive(String id) {
        ScriptTemplateEntity entity = findEntityById(id);
        if (entity.getStatus() != ScriptTemplateStatus.DEPRECATED
                && entity.getStatus() != ScriptTemplateStatus.DRAFT) {
            throw new IllegalStateException("Only DEPRECATED or DRAFT templates can be archived");
        }

        entity.setStatus(ScriptTemplateStatus.ARCHIVED);
        entity.setUpdatedBy(getCurrentUserId());
        return toDTO(repository.save(entity));
    }

    // ==================== Private Helpers ====================

    private ScriptTemplateEntity findEntityById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ScriptTemplate not found with id: " + id));
    }

    private void requireStatus(ScriptTemplateEntity entity,
                                ScriptTemplateStatus expected, String message) {
        if (entity.getStatus() != expected) {
            throw new IllegalStateException(message
                    + ". Current status: " + entity.getStatus());
        }
    }

    private String getCurrentUserId() {
        Principal principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        return principal != null ? principal.getName() : "system";
    }

    private String requireTenantId() {
        String tenantId = runtimeContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Script template operation requires a tenant context");
        }
        return tenantId;
    }

    /**
     * Converts a JPA entity to its DTO representation.
     *
     * @param entity the JPA entity
     * @return the DTO record
     */
    private ScriptTemplateDTO toDTO(ScriptTemplateEntity entity) {
        List<ScriptVariableDTO> variableDTOs = entity.getVariables() == null
                ? List.of()
                : entity.getVariables().stream()
                .map(v -> new ScriptVariableDTO(v.getKey(), v.getLabel(),
                        v.getDescription(), v.getDefaultValue(), v.getOrder()))
                .toList();

        return new ScriptTemplateDTO(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getCategory(),
                entity.getScenario(),
                entity.getContent(),
                variableDTOs,
                entity.getGuidance(),
                entity.getExpectedOutcome(),
                entity.getStatus(),
                entity.getVersion(),
                entity.getTags() == null ? List.of() : List.copyOf(entity.getTags()),
                entity.getProductIds() == null ? List.of() : List.copyOf(entity.getProductIds()),
                entity.getUsageCount(),
                entity.getEffectivenessRating(),
                entity.getReviewComments(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt(),
                entity.getReviewedBy(),
                entity.getReviewedAt()
        );
    }
}
