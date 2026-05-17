/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.entity;

import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * JPA entity representing a script template.
 *
 * <p>Mapped to table {@code compliance_script_template}. Each template
 * contains conversation guidance text with variable placeholders and
 * follows a review/publish lifecycle.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Entity
@Table(name = "compliance_script_template")
public class ScriptTemplateEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "code", length = 50, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30, nullable = false)
    private ScriptCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "scenario", length = 30, nullable = false)
    private ScriptScenario scenario;

    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "compliance_script_variable",
            joinColumns = @JoinColumn(name = "template_id"))
    @OrderColumn(name = "var_order")
    private List<ScriptVariableEmbeddable> variables = new ArrayList<>();

    @Column(name = "guidance", length = 2000)
    private String guidance;

    @Column(name = "expected_outcome", length = 1000)
    private String expectedOutcome;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ScriptTemplateStatus status;

    @Column(name = "version", length = 20)
    private String version;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "compliance_script_tag",
            joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "tag", length = 50)
    private List<String> tags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "compliance_script_product",
            joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "product_id", length = 36)
    private List<String> productIds = new ArrayList<>();

    @Column(name = "usage_count", nullable = false)
    private long usageCount;

    @Column(name = "effectiveness_rating")
    private Double effectivenessRating;

    @Column(name = "review_comments", length = 2000)
    private String reviewComments;

    @Column(name = "created_by", length = 36)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_by", length = 36)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /**
     * JPA lifecycle callback — generates UUID and sets creation timestamp.
     */
    @PrePersist
    void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /**
     * JPA lifecycle callback — updates the modification timestamp.
     */
    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ========== Getters and Setters ==========

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ScriptCategory getCategory() { return category; }
    public void setCategory(ScriptCategory category) { this.category = category; }

    public ScriptScenario getScenario() { return scenario; }
    public void setScenario(ScriptScenario scenario) { this.scenario = scenario; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<ScriptVariableEmbeddable> getVariables() { return variables; }
    public void setVariables(List<ScriptVariableEmbeddable> variables) { this.variables = variables; }

    public String getGuidance() { return guidance; }
    public void setGuidance(String guidance) { this.guidance = guidance; }

    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }

    public ScriptTemplateStatus getStatus() { return status; }
    public void setStatus(ScriptTemplateStatus status) { this.status = status; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public List<String> getProductIds() { return productIds; }
    public void setProductIds(List<String> productIds) { this.productIds = productIds; }

    public long getUsageCount() { return usageCount; }
    public void setUsageCount(long usageCount) { this.usageCount = usageCount; }

    public Double getEffectivenessRating() { return effectivenessRating; }
    public void setEffectivenessRating(Double effectivenessRating) { this.effectivenessRating = effectivenessRating; }

    public String getReviewComments() { return reviewComments; }
    public void setReviewComments(String reviewComments) { this.reviewComments = reviewComments; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
