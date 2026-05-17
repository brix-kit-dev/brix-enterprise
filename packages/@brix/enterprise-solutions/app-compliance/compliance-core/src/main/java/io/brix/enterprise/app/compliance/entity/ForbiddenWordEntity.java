/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.entity;

import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA entity representing a forbidden word or phrase rule.
 *
 * <p>Mapped to table {@code compliance_forbidden_word}. Each rule
 * defines a word/phrase that is not allowed in agent communications,
 * along with matching parameters and suggested alternatives.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Entity
@Table(name = "compliance_forbidden_word")
public class ForbiddenWordEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "word", length = 500, nullable = false)
    private String word;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30, nullable = false)
    private ForbiddenWordCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false)
    private ForbiddenWordSeverity severity;

    @Column(name = "reason", length = 1000, nullable = false)
    private String reason;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "compliance_forbidden_word_alternative",
            joinColumns = @JoinColumn(name = "forbidden_word_id"))
    @Column(name = "alternative", length = 500)
    private List<String> alternatives = new ArrayList<>();

    @Column(name = "case_sensitive", nullable = false)
    private boolean caseSensitive;

    @Column(name = "whole_word_only", nullable = false)
    private boolean wholeWordOnly;

    @Column(name = "pattern", length = 1000)
    private String pattern;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_by", length = 36)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ========== Getters and Setters ==========

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    public ForbiddenWordCategory getCategory() { return category; }
    public void setCategory(ForbiddenWordCategory category) { this.category = category; }

    public ForbiddenWordSeverity getSeverity() { return severity; }
    public void setSeverity(ForbiddenWordSeverity severity) { this.severity = severity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public List<String> getAlternatives() { return alternatives; }
    public void setAlternatives(List<String> alternatives) { this.alternatives = alternatives; }

    public boolean isCaseSensitive() { return caseSensitive; }
    public void setCaseSensitive(boolean caseSensitive) { this.caseSensitive = caseSensitive; }

    public boolean isWholeWordOnly() { return wholeWordOnly; }
    public void setWholeWordOnly(boolean wholeWordOnly) { this.wholeWordOnly = wholeWordOnly; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
