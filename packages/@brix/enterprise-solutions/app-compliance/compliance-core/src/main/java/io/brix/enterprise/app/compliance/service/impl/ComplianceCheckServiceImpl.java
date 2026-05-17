/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.service.impl;

import io.brix.enterprise.app.compliance.dto.ComplianceCheckRequest;
import io.brix.enterprise.app.compliance.dto.ComplianceCheckResultDTO;
import io.brix.enterprise.app.compliance.dto.ComplianceMatchDTO;
import io.brix.enterprise.app.compliance.entity.ComplianceCheckResultEntity;
import io.brix.enterprise.app.compliance.entity.ComplianceMatchEmbeddable;
import io.brix.enterprise.app.compliance.entity.ForbiddenWordEntity;
import io.brix.enterprise.app.compliance.enums.ComplianceCheckStatus;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import io.brix.enterprise.app.compliance.event.ComplianceCheckCompletedEvent;
import io.brix.enterprise.app.compliance.repository.ComplianceCheckResultRepository;
import io.brix.enterprise.app.compliance.repository.ForbiddenWordRepository;
import io.brix.enterprise.app.compliance.service.ComplianceCheckService;
import io.runtime.sdk.context.RuntimeContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Production implementation of {@link ComplianceCheckService}.
 *
 * <p>Scans content against all active forbidden-word rules using exact
 * string matching or regex patterns. The engine:</p>
 * <ol>
 *   <li>Loads all enabled rules (optionally filtered by requested categories)</li>
 *   <li>For each rule, scans content using word-boundary or regex matching</li>
 *   <li>Collects all matches and computes severity breakdown counts</li>
 *   <li>Determines the overall status based on the highest severity found</li>
 *   <li>Persists the result and publishes a {@code ComplianceCheckCompletedEvent}</li>
 * </ol>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Service
@Transactional
public class ComplianceCheckServiceImpl implements ComplianceCheckService {

    private final ForbiddenWordRepository forbiddenWordRepository;
    private final ComplianceCheckResultRepository resultRepository;
    private final RuntimeContext runtimeContext;

    public ComplianceCheckServiceImpl(ForbiddenWordRepository forbiddenWordRepository,
                                       ComplianceCheckResultRepository resultRepository,
                                       RuntimeContext runtimeContext) {
        this.forbiddenWordRepository = Objects.requireNonNull(forbiddenWordRepository);
        this.resultRepository = Objects.requireNonNull(resultRepository);
        this.runtimeContext = Objects.requireNonNull(runtimeContext);
    }

    @Override
    public ComplianceCheckResultDTO check(ComplianceCheckRequest request) {
        String tenantId = requireTenantId();

        // 1. Load active rules
        List<ForbiddenWordEntity> rules = forbiddenWordRepository.findByEnabledTrue();

        // Optionally filter by requested categories
        if (request.categories() != null && !request.categories().isEmpty()) {
            rules = rules.stream()
                    .filter(r -> request.categories().contains(r.getCategory()))
                    .toList();
        }

        // 2. Scan content against each rule
        String content = request.content();
        List<ComplianceMatchEmbeddable> matches = new ArrayList<>();

        for (ForbiddenWordEntity rule : rules) {
            Pattern compiledPattern = compilePattern(rule);
            Matcher matcher = compiledPattern.matcher(content);

            while (matcher.find()) {
                matches.add(new ComplianceMatchEmbeddable(
                        rule.getId(),
                        matcher.group(),
                        matcher.start(),
                        matcher.end(),
                        rule.getSeverity(),
                        rule.getCategory(),
                        rule.getReason()
                ));
            }
        }

        // 3. Compute severity breakdown
        int criticalCount = countBySeverity(matches, ForbiddenWordSeverity.CRITICAL);
        int highCount = countBySeverity(matches, ForbiddenWordSeverity.HIGH);
        int mediumCount = countBySeverity(matches, ForbiddenWordSeverity.MEDIUM);
        int lowCount = countBySeverity(matches, ForbiddenWordSeverity.LOW);
        int issueCount = matches.size();

        // 4. Determine overall status
        ComplianceCheckStatus status;
        if (criticalCount > 0 || highCount > 0) {
            status = ComplianceCheckStatus.FAIL;
        } else if (mediumCount > 0 || lowCount > 0) {
            status = ComplianceCheckStatus.WARNING;
        } else {
            status = ComplianceCheckStatus.PASS;
        }

        // 5. Persist result
        ComplianceCheckResultEntity entity = new ComplianceCheckResultEntity();
        entity.setTenantId(tenantId);
        entity.setContent(content);
        entity.setStatus(status);
        entity.setIssueCount(issueCount);
        entity.setCriticalCount(criticalCount);
        entity.setHighCount(highCount);
        entity.setMediumCount(mediumCount);
        entity.setLowCount(lowCount);
        entity.setMatches(matches);
        entity.setCheckedAt(LocalDateTime.now());
        entity.setCheckedBy(getCurrentUserId());
        entity.setEntityType(request.entityType());
        entity.setEntityId(request.entityId());

        ComplianceCheckResultEntity saved = resultRepository.save(entity);

        // 6. Publish integration event
        runtimeContext.getEventBus().publishIntegration(new ComplianceCheckCompletedEvent(
                saved.getId(), status, issueCount,
            request.entityType(), request.entityId(), saved.getTenantId()));

        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceCheckResultDTO findById(String id) {
        ComplianceCheckResultEntity entity = resultRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ComplianceCheckResult not found with id: " + id));
        return toDTO(entity);
    }

    // ==================== Private Helpers ====================

    /**
     * Compiles a regex Pattern for the given forbidden-word rule.
     *
     * <p>If the rule has an explicit regex pattern, use it directly.
     * Otherwise, build a pattern from the word with optional
     * case-sensitivity and whole-word boundary settings.</p>
     *
     * @param rule the forbidden word rule
     * @return compiled regex Pattern
     */
    private Pattern compilePattern(ForbiddenWordEntity rule) {
        String regex;
        if (rule.getPattern() != null && !rule.getPattern().isBlank()) {
            regex = rule.getPattern();
        } else {
            regex = Pattern.quote(rule.getWord());
            if (rule.isWholeWordOnly()) {
                regex = "\\b" + regex + "\\b";
            }
        }

        int flags = 0;
        if (!rule.isCaseSensitive()) {
            flags |= Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
        }
        return Pattern.compile(regex, flags);
    }

    private int countBySeverity(List<ComplianceMatchEmbeddable> matches,
                                 ForbiddenWordSeverity severity) {
        return (int) matches.stream()
                .filter(m -> m.getSeverity() == severity)
                .count();
    }

    private String getCurrentUserId() {
        Principal principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        return principal != null ? principal.getName() : "system";
    }

    private String requireTenantId() {
        String tenantId = runtimeContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Compliance check requires a tenant context");
        }
        return tenantId;
    }

    private ComplianceCheckResultDTO toDTO(ComplianceCheckResultEntity entity) {
        List<ComplianceMatchDTO> matchDTOs = entity.getMatches() == null
                ? List.of()
                : entity.getMatches().stream()
                .map(m -> new ComplianceMatchDTO(
                        m.getForbiddenWordId(),
                        m.getMatchedText(),
                        m.getStartIndex(),
                        m.getEndIndex(),
                        m.getSeverity(),
                        m.getCategory(),
                        m.getReason(),
                        List.of() // alternatives are not persisted in the match
                ))
                .toList();

        return new ComplianceCheckResultDTO(
                entity.getId(),
                entity.getContent(),
                entity.getStatus(),
                entity.getIssueCount(),
                entity.getCriticalCount(),
                entity.getHighCount(),
                entity.getMediumCount(),
                entity.getLowCount(),
                matchDTOs,
                entity.getCheckedAt(),
                entity.getCheckedBy(),
                entity.getEntityType(),
                entity.getEntityId()
        );
    }
}
