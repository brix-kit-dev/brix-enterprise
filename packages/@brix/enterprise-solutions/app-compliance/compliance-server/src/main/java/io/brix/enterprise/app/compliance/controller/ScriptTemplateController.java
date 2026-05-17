/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.controller;

import io.brix.enterprise.app.compliance.dto.CreateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.dto.ScriptTemplateDTO;
import io.brix.enterprise.app.compliance.dto.UpdateScriptTemplateRequest;
import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import io.brix.enterprise.app.compliance.service.ScriptTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for script template management.
 *
 * <p>Exposes CRUD and lifecycle endpoints under
 * {@code /api/v1/compliance/script-templates}.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@RestController
@RequestMapping("/api/v1/compliance/script-templates")
@Tag(name = "Script Templates", description = "Compliance script template management APIs")
public class ScriptTemplateController {

    private final ScriptTemplateService service;

    public ScriptTemplateController(ScriptTemplateService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Create a new script template")
    public ResponseEntity<ScriptTemplateDTO> create(
            @Valid @RequestBody CreateScriptTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing script template")
    public ResponseEntity<ScriptTemplateDTO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateScriptTemplateRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a script template by ID")
    public ResponseEntity<ScriptTemplateDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    @Operation(summary = "Query script templates with filters")
    public ResponseEntity<Page<ScriptTemplateDTO>> query(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ScriptCategory category,
            @RequestParam(required = false) ScriptScenario scenario,
            @RequestParam(required = false) ScriptTemplateStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.query(name, category, scenario, status, pageable));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a draft script template")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit-review")
    @Operation(summary = "Submit a draft template for compliance review")
    public ResponseEntity<ScriptTemplateDTO> submitForReview(@PathVariable String id) {
        return ResponseEntity.ok(service.submitForReview(id));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve and publish a template")
    public ResponseEntity<ScriptTemplateDTO> approve(
            @PathVariable String id,
            @RequestParam(required = false) String reviewComments) {
        return ResponseEntity.ok(service.approveAndPublish(id, reviewComments));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a template, reverting it to draft")
    public ResponseEntity<ScriptTemplateDTO> reject(
            @PathVariable String id,
            @RequestParam String reviewComments) {
        return ResponseEntity.ok(service.reject(id, reviewComments));
    }

    @PostMapping("/{id}/deprecate")
    @Operation(summary = "Mark a published template as deprecated")
    public ResponseEntity<ScriptTemplateDTO> deprecate(@PathVariable String id) {
        return ResponseEntity.ok(service.deprecate(id));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a deprecated template")
    public ResponseEntity<ScriptTemplateDTO> archive(@PathVariable String id) {
        return ResponseEntity.ok(service.archive(id));
    }
}
