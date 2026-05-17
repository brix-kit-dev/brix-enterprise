/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service;

import io.brix.enterprise.app.compliance.dto.CreateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.dto.ForbiddenWordDTO;
import io.brix.enterprise.app.compliance.dto.UpdateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for managing forbidden word/phrase rules.
 *
 * <p>Forbidden words are the foundation of the compliance checking engine.
 * This service provides CRUD operations and bulk management for rules.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public interface ForbiddenWordService {

    /**
     * Creates a new forbidden word rule.
     *
     * @param request the creation request
     * @return the created forbidden word DTO with generated ID
     */
    ForbiddenWordDTO create(CreateForbiddenWordRequest request);

    /**
     * Updates an existing forbidden word rule.
     *
     * @param id      the rule UUID
     * @param request the partial update request
     * @return the updated rule DTO
     * @throws jakarta.persistence.EntityNotFoundException if the rule does not exist
     */
    ForbiddenWordDTO update(String id, UpdateForbiddenWordRequest request);

    /**
     * Retrieves a forbidden word rule by its unique ID.
     *
     * @param id the rule UUID
     * @return the rule DTO
     * @throws jakarta.persistence.EntityNotFoundException if the rule does not exist
     */
    ForbiddenWordDTO findById(String id);

    /**
     * Queries forbidden word rules with optional filters and pagination.
     *
     * @param word     word filter (partial match, nullable)
     * @param category category filter (exact match, nullable)
     * @param severity severity filter (exact match, nullable)
     * @param enabled  enabled filter (nullable)
     * @param pageable pagination and sorting parameters
     * @return a page of matching rule DTOs
     */
    Page<ForbiddenWordDTO> query(String word, ForbiddenWordCategory category,
                                  ForbiddenWordSeverity severity,
                                  Boolean enabled, Pageable pageable);

    /**
     * Returns all active (enabled) forbidden word rules, used internally
     * by the compliance checking engine.
     *
     * @return an unmodifiable list of all enabled rules
     */
    List<ForbiddenWordDTO> findAllEnabled();

    /**
     * Deletes a forbidden word rule.
     *
     * @param id the rule UUID
     * @throws jakarta.persistence.EntityNotFoundException if the rule does not exist
     */
    void delete(String id);

    /**
     * Toggles the enabled/disabled state of a rule.
     *
     * @param id      the rule UUID
     * @param enabled the new enabled state
     * @return the updated rule DTO
     */
    ForbiddenWordDTO setEnabled(String id, boolean enabled);
}
