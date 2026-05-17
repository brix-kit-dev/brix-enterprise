/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.controller;

import io.brix.enterprise.app.compliance.dto.ComplianceCheckRequest;
import io.brix.enterprise.app.compliance.dto.ComplianceCheckResultDTO;
import io.brix.enterprise.app.compliance.service.ComplianceCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for executing compliance checks.
 *
 * <p>Exposes check execution and result retrieval endpoints under
 * {@code /api/v1/compliance/checks}.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@RestController
@RequestMapping("/api/v1/compliance/checks")
@Tag(name = "Compliance Checks", description = "Content compliance checking APIs")
public class ComplianceCheckController {

    private final ComplianceCheckService service;

    public ComplianceCheckController(ComplianceCheckService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Execute a compliance check on content")
    public ResponseEntity<ComplianceCheckResultDTO> check(
            @Valid @RequestBody ComplianceCheckRequest request) {
        return ResponseEntity.ok(service.check(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve a previous compliance check result")
    public ResponseEntity<ComplianceCheckResultDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }
}
