/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.event;

import io.brix.enterprise.app.compliance.enums.ComplianceCheckStatus;
import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

/**
 * Integration event published after a compliance check completes.
 *
 * <p>Subscribers can use this event to trigger downstream workflows
 * (e.g. auto-archiving content that fails compliance, notifying
 * supervisors of critical violations).</p>
 *
 * <h3>Routing</h3>
 * <ul>
 *   <li>Routing key: {@code compliance.check.<checkResultId>}</li>
 *   <li>Source module: {@code brix-app-compliance}</li>
 * </ul>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 * @see IntegrationEvent
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class ComplianceCheckCompletedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;
    private static final String SOURCE_MODULE = "brix-app-compliance";

    private final String checkResultId;
    private final ComplianceCheckStatus status;
    private final int issueCount;
    private final String entityType;
    private final String entityId;
    private final String tenantId;

    /**
     * Constructs a new compliance-check-completed event.
     *
     * @param checkResultId the unique ID of the check result
     * @param status        the overall check status (PASS / WARNING / FAIL)
     * @param issueCount    total number of issues found
     * @param entityType    the type of entity that was checked (nullable)
     * @param entityId      the ID of the entity that was checked (nullable)
      * @param tenantId      the tenant that owns the checked content
     */
    public ComplianceCheckCompletedEvent(String checkResultId,
                                          ComplianceCheckStatus status,
                                          int issueCount,
                                          String entityType,
                                                        String entityId,
                                                        String tenantId) {
          super(SOURCE_MODULE, tenantId);
        this.checkResultId = checkResultId;
        this.status = status;
        this.issueCount = issueCount;
        this.entityType = entityType;
        this.entityId = entityId;
          this.tenantId = tenantId;
    }

    @Override
    public String getRoutingKey() {
        return "compliance.check." + checkResultId;
    }

    public String getCheckResultId() {
        return checkResultId;
    }

    public ComplianceCheckStatus getStatus() {
        return status;
    }

    public int getIssueCount() {
        return issueCount;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getTenantId() {
        return tenantId;
    }

    @Override
    public String toString() {
        return "ComplianceCheckCompletedEvent{"
                + "eventId=" + getEventId()
                + ", checkResultId='" + checkResultId + '\''
                + ", status=" + status
                + ", issueCount=" + issueCount
                + ", entityType='" + entityType + '\''
                + ", entityId='" + entityId + '\''
                + ", tenantId='" + tenantId + '\''
                + '}';
    }
}
