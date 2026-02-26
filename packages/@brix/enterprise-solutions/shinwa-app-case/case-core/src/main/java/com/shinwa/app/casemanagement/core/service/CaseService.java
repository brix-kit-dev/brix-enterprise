package com.shinwa.app.casemanagement.core.service;

import com.shinwa.app.casemanagement.api.dto.CaseDTO;
import com.shinwa.app.casemanagement.api.event.CaseCreatedEvent;
import com.shinwa.app.casemanagement.api.request.CreateCaseRequest;
import com.shinwa.app.casemanagement.api.request.UpdateCaseRequest;
import com.shinwa.app.casemanagement.core.entity.CaseEntity;
import com.shinwa.app.casemanagement.core.repository.CaseRepository;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.LogLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.Optional;

/**
 * Case Business Service
 * 
 * <p>Provides core business logic implementation for Case module.</p>
 * 
 * <p><b>v3.0 Core Architecture Constraints:</b></p>
 * <ul>
 *   <li>MUST access all capabilities through {@link RuntimeContext}, not directly depend on infrastructure</li>
 *   <li>MUST publish events through EventBusCapability, not directly use KafkaTemplate</li>
 *   <li>MUST obtain authentication info through AuthContextCapability</li>
 *   <li>MUST record logs/metrics through ObservabilityCapability</li>
 * </ul>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // Get current user
 * String userId = context.getAuthContext().getCurrentUserId();
 * 
 * // Publish event
 * context.getEventBus().publish(event);
 * 
 * // Log message
 * context.getObservability().log(LogLevel.INFO, "Operation completed");
 * }</pre>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CaseService {

    /**
     * [v3.0 Core] Runtime context
     * <p>Obtain all capabilities through RuntimeContext. Direct dependencies on Kafka/Redis etc. are prohibited.</p>
     */
    private final RuntimeContext runtimeContext;

    /**
     * Data repository
     */
    private final CaseRepository repository;

    /**
     * Creates a new Case.
     * 
     * <p>Creates a new record and publishes domain event to notify other modules.</p>
     * 
     * @param request create request
     * @return created DTO
     * @throws IllegalArgumentException if name already exists
     */
    @Transactional
    public CaseDTO create(CreateCaseRequest request) {
        // [v3.0] Get tenant ID and user ID through RuntimeContext
        String tenantId = runtimeContext.getTenantId();
        Principal principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        String userId = principal != null ? principal.getName() : "system";

        // Check for duplicate name
        if (repository.existsByTenantIdAndName(tenantId, request.getName())) {
            throw new IllegalArgumentException("Name already exists: " + request.getName());
        }

        // Create entity
        CaseEntity entity = CaseEntity.builder()
            .name(request.getName())
            .description(request.getDescription())
            .status("DRAFT")
            .tenantId(tenantId)
            .createdBy(userId)
            .build();

        // Save entity
        entity = repository.save(entity);

        // [v3.0 Core] Publish integration event (via EventBusCapability, not KafkaTemplate)
        // Note: CaseCreatedEvent uses constructor instead of builder pattern for immutability
        CaseCreatedEvent event = new CaseCreatedEvent(
            entity.getId(),
            entity.getName(),
            userId,
            tenantId
        );
        runtimeContext.getEventBus().publishIntegration(event);

        // [v3.0] Record audit log
        runtimeContext.getObservability().log(
            LogLevel.INFO,
            "Case created successfully: id={}, name={}", entity.getId(), entity.getName()
        );

        return toDTO(entity);
    }

    /**
     * Finds a Case by ID.
     * 
     * @param id record ID
     * @return DTO (optional)
     */
    @Transactional(readOnly = true)
    public Optional<CaseDTO> findById(String id) {
        return repository.findById(id).map(this::toDTO);
    }

    /**
     * Lists all Cases with pagination.
     * 
     * @param pageable pagination parameters
     * @return paginated results
     */
    @Transactional(readOnly = true)
    public Page<CaseDTO> findAll(Pageable pageable) {
        String tenantId = runtimeContext.getTenantId();
        return repository.findByTenantId(tenantId, pageable).map(this::toDTO);
    }

    /**
     * Updates an existing Case.
     * 
     * <p>Supports partial update - only non-null fields will be updated.</p>
     * 
     * @param id record ID
     * @param request update request containing fields to update
     * @return updated DTO if found, empty otherwise
     */
    @Transactional
    public Optional<CaseDTO> update(String id, UpdateCaseRequest request) {
        return repository.findById(id)
            .map(entity -> {
                // Update only non-null fields (partial update pattern)
                if (request.getName() != null) {
                    entity.setName(request.getName());
                }
                if (request.getDescription() != null) {
                    entity.setDescription(request.getDescription());
                }
                if (request.getStatus() != null) {
                    entity.setStatus(request.getStatus());
                }
                
                // Get updater info through RuntimeContext
                Principal principal = runtimeContext.getAuthContext().getCurrentPrincipal();
                String updatedBy = principal != null ? principal.getName() : "system";
                entity.setUpdatedBy(updatedBy);
                
                // Save and return
                CaseEntity saved = repository.save(entity);
                
                // [v3.0] Record audit log
                runtimeContext.getObservability().log(
                    LogLevel.INFO,
                    "Case updated successfully: id={}, name={}", saved.getId(), saved.getName()
                );
                
                return toDTO(saved);
            });
    }

    /**
     * Searches Cases by keyword.
     * 
     * @param keyword search keyword
     * @param pageable pagination parameters
     * @return paginated results
     */
    @Transactional(readOnly = true)
    public Page<CaseDTO> search(String keyword, Pageable pageable) {
        String tenantId = runtimeContext.getTenantId();
        return repository.searchByName(tenantId, keyword, pageable).map(this::toDTO);
    }

    /**
     * Deletes a Case by ID.
     * 
     * @param id record ID
     */
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
        
        runtimeContext.getObservability().log(
            LogLevel.INFO,
            "Case deleted successfully: id={}", id
        );
    }

    /**
     * Converts entity to DTO.
     * 
     * @param entity entity
     * @return DTO
     */
    private CaseDTO toDTO(CaseEntity entity) {
        return CaseDTO.builder()
            .id(entity.getId())
            .name(entity.getName())
            .description(entity.getDescription())
            .status(entity.getStatus())
            .tenantId(entity.getTenantId())
            .createdBy(entity.getCreatedBy())
            .createdAt(entity.getCreatedAt())
            .updatedBy(entity.getUpdatedBy())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
}
