package com.shinwa.app.casemanagement.core.handler;

import io.runtime.sdk.annotation.EventHandler;
import io.runtime.sdk.event.DomainEvent;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.LogLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Case Module Event Handler
 * 
 * <p>Handles external events subscribed by the module.</p>
 * 
 * <p><b>v3.0 Event Handling Mechanism:</b></p>
 * <ul>
 *   <li>Uses @EventHandler annotation to declare event handling methods</li>
 *   <li>Subscribed events must be declared in module-manifest.yaml under events.subscribes</li>
 *   <li>Runtime Shell automatically routes events based on manifest configuration</li>
 *   <li>Handler methods must be idempotent (support retry)</li>
 * </ul>
 * 
 * <p><b>Usage Example:</b></p>
 * <pre>{@code
 * // Declare subscription in module-manifest.yaml
 * events:
 *   subscribes:
 *     - type: "UserCreatedEvent"
 *       handler: "CaseEventHandler.onUserCreated"
 * }</pre>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CaseEventHandler {

    /**
     * [v3.0 Core] Runtime context
     */
    private final RuntimeContext runtimeContext;

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
    @EventHandler(eventType = "UserCreatedEvent")
    public void onUserCreated(DomainEvent event) {
        // [Idempotency check] Check if event has been processed
        String eventId = event.getEventId();
        if (isEventProcessed(eventId)) {
            log.info("[Case Module] Event already processed, skipping: eventId={}", eventId);
            return;
        }

        try {
            // Business processing logic
            log.info("[Case Module] Received user created event: eventId={}, aggregateId={}", 
                eventId, event.getAggregateId());

            // TODO: Implement specific business logic
            // For example: create default Case data for new user

            // Mark processing complete
            markEventProcessed(eventId);

            // Record audit log
            runtimeContext.getObservability().log(
                LogLevel.INFO,
                "[Case Module] User created event processed successfully: eventId={}", eventId
            );

        } catch (Exception e) {
            // Log error (let Runtime Shell decide whether to retry)
            runtimeContext.getObservability().log(
                LogLevel.ERROR,
                "[Case Module] Event processing failed: eventId={}, error={}", eventId, e.getMessage()
            );
            throw e; // Throw exception to trigger retry mechanism
        }
    }

    /**
     * Checks if event has been processed (idempotency).
     * 
     * @param eventId event ID
     * @return whether processed
     */
    private boolean isEventProcessed(String eventId) {
        // [Recommended implementation] Use StateStoreCapability to check
        // return runtimeContext.getStateStore()
        //     .exists("event:processed:" + eventId);
        
        // Simple implementation: return false for now
        return false;
    }

    /**
     * Marks event as processed.
     * 
     * @param eventId event ID
     */
    private void markEventProcessed(String eventId) {
        // [Recommended implementation] Use StateStoreCapability to record
        // runtimeContext.getStateStore()
        //     .put("event:processed:" + eventId, true, Duration.ofDays(7));
    }
}
