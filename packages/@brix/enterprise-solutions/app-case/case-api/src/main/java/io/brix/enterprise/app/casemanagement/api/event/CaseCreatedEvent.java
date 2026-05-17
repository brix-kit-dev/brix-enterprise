/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.casemanagement.api.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

/**
 * Case Created Integration Event
 * 
 * <p>This integration event is published when a new Case is created. Other modules
 * (such as notification, timeline, audit) can subscribe to this event.</p>
 * 
 * <p><b>v3.0 Event Model Notes:</b></p>
 * <ul>
 *   <li>Extends {@link IntegrationEvent} for cross-module communication</li>
 *   <li>Declared in META-INF/plugin-manifest.json under events.publishes section</li>
 *   <li>Modules do not directly use Kafka/RabbitMQ; they publish via EventBusCapability</li>
 *   <li>Uses immutable final fields and constructor-based initialization</li>
 * </ul>
 * 
 * <p><b>Subscribers Handling Suggestions:</b></p>
 * <ul>
 *   <li>notification-service: Send case creation notification</li>
 *   <li>timeline-service: Record timeline event</li>
 *   <li>audit-service: Log case operation history</li>
 * </ul>
 * 
 * <p><b>Idempotent Processing:</b></p>
 * <p>Consumers should implement idempotency using {@code caseId} to prevent 
 * duplicate processing when events are replayed.</p>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // Publish event in Service
 * var event = new CaseCreatedEvent(
 *     entity.getId(),
 *     entity.getName(),
 *     context.getAuthContext().getCurrentUserId(),
 *     context.getTenantId()
 * );
 * context.getEventBus().publish(event);
 * }</pre>
 * 
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 * @see io.runtime.sdk.event.IntegrationEvent
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class CaseCreatedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;

    /**
     * Event type constant used for routing and deserialization.
     */
    public static final String EVENT_TYPE = "case.created";

    /**
     * Source module identifier for this event type.
     */
    public static final String SOURCE_MODULE = "brix-app-case";

    /**
     * Case unique identifier.
     */
    private final String caseId;

    /**
     * Case display name.
     */
    private final String caseName;

    /**
     * User ID who created this case.
     */
    private final String createdBy;

    /**
     * Tenant ID this case belongs to.
     */
    private final String tenantId;

    /**
     * Template code used to create this case (optional).
     */
    private final String templateCode;

    /**
     * Constructs a new CaseCreatedEvent.
     *
     * @param caseId    the unique case identifier
     * @param caseName  the case display name
     * @param createdBy the user ID who created the case
     * @param tenantId  the tenant ID this case belongs to
     */
    public CaseCreatedEvent(String caseId, String caseName, String createdBy, String tenantId) {
        this(caseId, caseName, createdBy, tenantId, null);
    }

    /**
     * Constructs a new CaseCreatedEvent with template information.
     *
     * @param caseId       the unique case identifier
     * @param caseName     the case display name
     * @param createdBy    the user ID who created the case
     * @param tenantId     the tenant ID this case belongs to
     * @param templateCode the template code used to create this case
     */
    public CaseCreatedEvent(String caseId, String caseName, String createdBy, 
                            String tenantId, String templateCode) {
        super(SOURCE_MODULE, tenantId);
        this.caseId = caseId;
        this.caseName = caseName;
        this.createdBy = createdBy;
        this.tenantId = tenantId;
        this.templateCode = templateCode;
    }

    /**
     * Gets the routing key for event partitioning.
     * <p>Uses caseId to ensure all events for the same case are processed in order.</p>
     *
     * @return the routing key for partitioning
     */
    @Override
    public String getRoutingKey() {
        return "case." + caseId;
    }

    /**
     * Gets the case unique identifier.
     *
     * @return the case ID
     */
    public String getCaseId() {
        return caseId;
    }

    /**
     * Gets the case display name.
     *
     * @return the case name
     */
    public String getCaseName() {
        return caseName;
    }

    /**
     * Gets the user ID who created this case.
     *
     * @return the creator user ID
     */
    public String getCreatedBy() {
        return createdBy;
    }

    /**
     * Gets the tenant ID this case belongs to.
     *
     * @return the tenant ID
     */
    public String getTenantId() {
        return tenantId;
    }

    /**
     * Gets the template code used to create this case.
     *
     * @return the template code, or null if not created from template
     */
    public String getTemplateCode() {
        return templateCode;
    }

    @Override
    public String toString() {
        return "CaseCreatedEvent{" +
                "eventId='" + getEventId() + '\'' +
                ", caseId='" + caseId + '\'' +
                ", caseName='" + caseName + '\'' +
                ", createdBy='" + createdBy + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", templateCode='" + templateCode + '\'' +
                ", timestamp=" + getTimestamp() +
                '}';
    }
}
