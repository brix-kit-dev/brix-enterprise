/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service;

import io.brix.enterprise.app.compliance.dto.ComplianceCheckRequest;
import io.brix.enterprise.app.compliance.dto.ComplianceCheckResultDTO;

/**
 * Service interface for executing compliance checks.
 *
 * <p>The compliance checking engine scans content against all active
 * forbidden-word rules and produces a {@link ComplianceCheckResultDTO}
 * with detailed match information. After each check completes, a
 * {@code ComplianceCheckCompletedEvent} is published on the EventBus.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public interface ComplianceCheckService {

    /**
     * Executes a compliance check on the provided content.
     *
     * <p>The engine performs the following steps:</p>
     * <ol>
     *   <li>Load all enabled forbidden-word rules (optionally filtered by categories)</li>
     *   <li>For each rule, scan the content using word match or regex pattern</li>
     *   <li>Aggregate matches and compute severity counts</li>
     *   <li>Determine overall status (PASS / WARNING / FAIL) based on highest severity</li>
     *   <li>Persist the result and publish a {@code ComplianceCheckCompletedEvent}</li>
     * </ol>
     *
     * @param request the check request containing the content and optional filters
     * @return the check result with all matches and severity breakdown
     */
    ComplianceCheckResultDTO check(ComplianceCheckRequest request);

    /**
     * Retrieves a previously executed compliance check result by its ID.
     *
     * @param id the check result UUID
     * @return the check result DTO
     * @throws jakarta.persistence.EntityNotFoundException if the result does not exist
     */
    ComplianceCheckResultDTO findById(String id);
}
