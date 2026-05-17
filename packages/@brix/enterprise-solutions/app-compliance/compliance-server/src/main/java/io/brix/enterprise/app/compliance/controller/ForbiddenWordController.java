/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.controller;

import io.brix.enterprise.app.compliance.dto.CreateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.dto.ForbiddenWordDTO;
import io.brix.enterprise.app.compliance.dto.UpdateForbiddenWordRequest;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.brix.enterprise.app.compliance.service.ForbiddenWordService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for forbidden word rule management.
 *
 * <p>Exposes CRUD endpoints under
 * {@code /api/v1/compliance/forbidden-words}.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@RestController
@RequestMapping("/api/v1/compliance/forbidden-words")
@Tag(name = "Forbidden Words", description = "Compliance forbidden word rule management APIs")
public class ForbiddenWordController {

    private final ForbiddenWordService service;

    public ForbiddenWordController(ForbiddenWordService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Create a new forbidden word rule")
    public ResponseEntity<ForbiddenWordDTO> create(
            @Valid @RequestBody CreateForbiddenWordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing forbidden word rule")
    public ResponseEntity<ForbiddenWordDTO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateForbiddenWordRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a forbidden word rule by ID")
    public ResponseEntity<ForbiddenWordDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    @Operation(summary = "Query forbidden word rules with filters")
    public ResponseEntity<Page<ForbiddenWordDTO>> query(
            @RequestParam(required = false) String word,
            @RequestParam(required = false) ForbiddenWordCategory category,
            @RequestParam(required = false) ForbiddenWordSeverity severity,
            @RequestParam(required = false) Boolean enabled,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.query(word, category, severity, enabled, pageable));
    }

    @GetMapping("/enabled")
    @Operation(summary = "List all enabled forbidden word rules")
    public ResponseEntity<List<ForbiddenWordDTO>> listEnabled() {
        return ResponseEntity.ok(service.findAllEnabled());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a forbidden word rule")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/enabled")
    @Operation(summary = "Toggle the enabled/disabled state of a rule")
    public ResponseEntity<ForbiddenWordDTO> setEnabled(
            @PathVariable String id,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(service.setEnabled(id, enabled));
    }
}
