/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.entity;

import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * Embeddable component representing a single forbidden-word match
 * within a {@link ComplianceCheckResultEntity}.
 *
 * <p>Stored in the {@code compliance_check_match} collection table.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Embeddable
public class ComplianceMatchEmbeddable {

    @Column(name = "forbidden_word_id", length = 36, nullable = false)
    private String forbiddenWordId;

    @Column(name = "matched_text", length = 500, nullable = false)
    private String matchedText;

    @Column(name = "start_index", nullable = false)
    private int startIndex;

    @Column(name = "end_index", nullable = false)
    private int endIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false)
    private ForbiddenWordSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30, nullable = false)
    private ForbiddenWordCategory category;

    @Column(name = "reason", length = 1000)
    private String reason;

    /** Default constructor required by JPA. */
    protected ComplianceMatchEmbeddable() {
    }

    /**
     * Constructs a new compliance match embeddable.
     *
     * @param forbiddenWordId ID of the matched forbidden-word rule
     * @param matchedText     the actual text that was matched
     * @param startIndex      start index (0-based) in the checked content
     * @param endIndex        end index (exclusive) in the checked content
     * @param severity        severity of the matched rule
     * @param category        category of the matched rule
     * @param reason          reason the word is forbidden
     */
    public ComplianceMatchEmbeddable(String forbiddenWordId, String matchedText,
                                      int startIndex, int endIndex,
                                      ForbiddenWordSeverity severity,
                                      ForbiddenWordCategory category,
                                      String reason) {
        this.forbiddenWordId = forbiddenWordId;
        this.matchedText = matchedText;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.severity = severity;
        this.category = category;
        this.reason = reason;
    }

    public String getForbiddenWordId() { return forbiddenWordId; }
    public void setForbiddenWordId(String forbiddenWordId) { this.forbiddenWordId = forbiddenWordId; }

    public String getMatchedText() { return matchedText; }
    public void setMatchedText(String matchedText) { this.matchedText = matchedText; }

    public int getStartIndex() { return startIndex; }
    public void setStartIndex(int startIndex) { this.startIndex = startIndex; }

    public int getEndIndex() { return endIndex; }
    public void setEndIndex(int endIndex) { this.endIndex = endIndex; }

    public ForbiddenWordSeverity getSeverity() { return severity; }
    public void setSeverity(ForbiddenWordSeverity severity) { this.severity = severity; }

    public ForbiddenWordCategory getCategory() { return category; }
    public void setCategory(ForbiddenWordCategory category) { this.category = category; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
