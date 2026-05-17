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
package io.brix.enterprise.app.casemanagement.core.handler;

import io.runtime.sdk.annotation.EventHandler;
import io.runtime.sdk.capability.LogLevel;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.event.IntegrationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Case Module Event Handler
 * 
 * <p>Handles external events subscribed by the module.</p>
 * 
 * <p><b>v3.0 Event Handling Mechanism:</b></p>
 * <ul>
 *   <li>Uses @EventHandler annotation to declare event handling methods</li>
 *   <li>Subscribed events must be declared in META-INF/plugin-manifest.json under events.subscribes</li>
 *   <li>Runtime Shell automatically routes events based on manifest configuration</li>
 *   <li>Handler methods must be idempotent (support retry)</li>
 * </ul>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // Declare subscription in META-INF/plugin-manifest.json
 * "events": {
 *   "subscribes": [
 *     { "type": "UserCreatedEvent", "handler": "CaseEventHandler.onUserCreated" }
 *   ]
 * }
 * }</pre>
 * 
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Component
public class CaseEventHandler {

    private static final Logger log = LoggerFactory.getLogger(CaseEventHandler.class);

    private static final String USER_CREATED_EVENT_TYPE = "UserCreatedEvent";
    private static final String USER_CREATED_HANDLER_ID = "case.user-created.handler";
    private static final String IDEMPOTENCY_KEY_PREFIX = "case:event-handler:user-created";
    private static final Duration IDEMPOTENCY_TTL = Duration.ofDays(7);

    /**
     * [v3.0 Core] Runtime context
     */
    private final RuntimeContext runtimeContext;

    public CaseEventHandler(RuntimeContext runtimeContext) {
        this.runtimeContext = runtimeContext;
    }

    /**
     * Handles user created event (example).
     * 
     * <p>This method is automatically called by Runtime Shell when UserCreatedEvent is published.</p>
     * 
     * <p><b>Idempotency Requirements:</b></p>
     * <ul>
     *   <li>Use event ID for deduplication</li>
     *   <li>Repeated processing should not cause side effects</li>
     *   <li>Recommended to record processing state in database</li>
     * </ul>
     * 
     * @param event user created event
     */
    @EventHandler(eventType = USER_CREATED_EVENT_TYPE)
    public void onUserCreated(IntegrationEvent event) {
        String eventId = event.getEventId();
        String tenantId = resolveTenantId(event);
        String idempotencyKey = buildIdempotencyKey(tenantId, eventId);
        boolean acquired = runtimeContext.getStateStore()
                .putIfAbsent(idempotencyKey, USER_CREATED_HANDLER_ID, IDEMPOTENCY_TTL);

        if (!acquired) {
            log.info("[Case Module] Duplicate event skipped: eventType={}, tenantId={}, eventId={}",
                    USER_CREATED_EVENT_TYPE, tenantId, eventId);
            return;
        }

        try {
            log.info("[Case Module] User created event accepted: tenantId={}, eventId={}, routingKey={}",
                    tenantId, eventId, event.getRoutingKey());

            runtimeContext.getObservability().log(
                LogLevel.INFO,
                "[Case Module] User created event processed successfully: tenantId={}, eventId={}",
                tenantId, eventId
            );

        } catch (Exception e) {
            runtimeContext.getStateStore().remove(idempotencyKey);
            runtimeContext.getObservability().log(
                LogLevel.ERROR,
                "[Case Module] Event processing failed: tenantId={}, eventId={}, error={}",
                tenantId, eventId, e.getMessage()
            );
            throw e;
        }
    }

    private String buildIdempotencyKey(String tenantId, String eventId) {
        return IDEMPOTENCY_KEY_PREFIX + ":" + tenantId + ":" + eventId;
    }

    private String resolveTenantId(IntegrationEvent event) {
        if (event.getTenantId() != null && !event.getTenantId().isBlank()) {
            return event.getTenantId();
        }

        String tenantId = runtimeContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("Case event handling requires a tenant context");
        }
        return tenantId;
    }
}
