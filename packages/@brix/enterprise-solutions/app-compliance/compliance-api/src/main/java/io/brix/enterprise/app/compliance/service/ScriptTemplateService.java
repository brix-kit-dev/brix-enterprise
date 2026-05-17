/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service;

import io.brix.enterprise.app.compliance.dto.CreateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.dto.ScriptTemplateDTO;
import io.brix.enterprise.app.compliance.dto.UpdateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for managing script templates.
 *
 * <p>Provides CRUD operations and lifecycle management (submit for review,
 * approve/reject, publish, deprecate, archive) for call-centre script
 * templates.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public interface ScriptTemplateService {

    /**
     * Creates a new script template in {@code DRAFT} status.
     *
     * @param request the creation request containing template details
     * @return the created template DTO with generated ID
     */
    ScriptTemplateDTO create(CreateScriptTemplateRequest request);

    /**
     * Updates an existing script template.
     *
     * <p>Only templates in {@code DRAFT} status can be updated.
     * Templates in other statuses must be reverted to draft first.</p>
     *
     * @param id      the template UUID
     * @param request the partial update request
     * @return the updated template DTO
     * @throws jakarta.persistence.EntityNotFoundException if the template does not exist
     * @throws IllegalStateException if the template is not in DRAFT status
     */
    ScriptTemplateDTO update(String id, UpdateScriptTemplateRequest request);

    /**
     * Retrieves a script template by its unique ID.
     *
     * @param id the template UUID
     * @return the template DTO
     * @throws jakarta.persistence.EntityNotFoundException if the template does not exist
     */
    ScriptTemplateDTO findById(String id);

    /**
     * Queries script templates with optional filters and pagination.
     *
     * @param name     name filter (partial match, nullable)
     * @param category category filter (exact match, nullable)
     * @param scenario scenario filter (exact match, nullable)
     * @param status   status filter (exact match, nullable)
     * @param pageable pagination and sorting parameters
     * @return a page of matching template DTOs
     */
    Page<ScriptTemplateDTO> query(String name, ScriptCategory category,
                                   ScriptScenario scenario,
                                   ScriptTemplateStatus status,
                                   Pageable pageable);

    /**
     * Deletes a script template. Only {@code DRAFT} templates can be deleted.
     *
     * @param id the template UUID
     * @throws jakarta.persistence.EntityNotFoundException if the template does not exist
     * @throws IllegalStateException if the template is not in DRAFT status
     */
    void delete(String id);

    /**
     * Submits a DRAFT template for compliance review.
     *
     * @param id the template UUID
     * @return the updated template DTO in PENDING_REVIEW status
     */
    ScriptTemplateDTO submitForReview(String id);

    /**
     * Approves and publishes a template after compliance review.
     *
     * <p>Fires a {@code ScriptTemplatePublishedEvent} on the EventBus.</p>
     *
     * @param id             the template UUID
     * @param reviewComments optional reviewer comments
     * @return the published template DTO
     */
    ScriptTemplateDTO approveAndPublish(String id, String reviewComments);

    /**
     * Rejects a template during compliance review, reverting it to DRAFT.
     *
     * @param id             the template UUID
     * @param reviewComments mandatory rejection reason
     * @return the rejected template DTO in DRAFT status
     */
    ScriptTemplateDTO reject(String id, String reviewComments);

    /**
     * Marks a published template as deprecated.
     *
     * @param id the template UUID
     * @return the deprecated template DTO
     */
    ScriptTemplateDTO deprecate(String id);

    /**
     * Archives a deprecated template, removing it from all listings.
     *
     * @param id the template UUID
     * @return the archived template DTO
     */
    ScriptTemplateDTO archive(String id);
}
