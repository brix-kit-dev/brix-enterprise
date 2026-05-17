/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.shared.event;

import io.runtime.sdk.event.CriticalEvent;
import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

import java.time.LocalDateTime;

/**
 * Integration event published when a tenant is suspended.
 *
 * <h3>Publisher</h3>
 * <p>Published by the <strong>tenant-management</strong> plugin when an administrator
 * or automated policy engine suspends a tenant's access to the platform.</p>
 *
 * <h3>Expected Subscribers</h3>
 * <ul>
 *   <li><strong>identity</strong> — disable all user accounts belonging to the suspended tenant</li>
 *   <li><strong>billing</strong> — pause billing cycles and freeze payment processing</li>
 *   <li><strong>session</strong> — force logout for all active sessions under the tenant</li>
 *   <li><strong>audit</strong> — record the tenant suspension audit trail</li>
 *   <li><strong>notification</strong> — send suspension notices to tenant administrators</li>
 * </ul>
 *
 * <h3>Idempotency</h3>
 * <p>Consumers should implement idempotent handling keyed on
 * {@link #getEventId()} to tolerate at-least-once delivery.</p>
 *
 * <h3>Routing</h3>
 * <p>Routing key format: {@code tenant.<tenantId>}.  This allows
 * topic-based subscribers to filter by specific tenant.</p>
 *
 * <h3>Guaranteed Delivery</h3>
 * <p>Annotated with {@link CriticalEvent} to route through the Outbox pattern,
 * ensuring at-least-once transactional delivery.  Suspending a tenant is a
 * platform-wide security action that cascades to all downstream services;
 * no subscriber may miss this event (R13.4 compliance).</p>
 *
 * @author Brix Platform Team
 * @since 3.2.0
 * @see io.runtime.sdk.event.IntegrationEvent
 * @see CriticalEvent
 */
@CriticalEvent
@SchemaVersion(value = 1, minCompatible = 1)
public class TenantSuspendedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;

    /** Source module identifier used in the IntegrationEvent base class. */
    private static final String SOURCE_MODULE = "brix-app-tenant";

    // ── Payload fields ────────────────────────────────────────

    /** The unique identifier of the suspended tenant. */
    private final String tenantId;

    /** Human-readable reason for the tenant suspension. */
    private final String reason;

    /** Timestamp when the tenant was suspended. */
    private final LocalDateTime suspendedAt;

    /** Identifier of the administrator or system policy that initiated the suspension. */
    private final String suspendedBy;

    // ── Constructor ───────────────────────────────────────────

    /**
     * Construct a new TenantSuspendedEvent.
     *
     * <p>The {@code tenantId} is passed to the {@link IntegrationEvent} base class
     * so that EventBus adapters can enforce tenant-level routing and filtering
     * without inspecting the payload (R3.6 compliance).</p>
     *
     * @param tenantId    unique identifier of the suspended tenant (required)
     * @param reason      human-readable reason for suspending (may be null)
     * @param suspendedAt timestamp when the tenant was suspended (required)
     * @param suspendedBy identifier of the initiator (may be null for automated policies)
     */
    public TenantSuspendedEvent(String tenantId,
                                String reason,
                                LocalDateTime suspendedAt,
                                String suspendedBy) {
        super(SOURCE_MODULE, tenantId);
        this.tenantId = tenantId;
        this.reason = reason;
        this.suspendedAt = suspendedAt;
        this.suspendedBy = suspendedBy;
    }

    // ── IntegrationEvent contract ─────────────────────────────

    /**
     * Returns the routing key for topic-based event distribution.
     *
     * <p>Format: {@code tenant.<tenantId>}</p>
     *
     * @return routing key string
     */
    @Override
    public String getRoutingKey() {
        return "tenant." + tenantId;
    }

    // ── Getters ───────────────────────────────────────────────

    /**
     * @return unique identifier of the suspended tenant
     */
    public String getTenantId() {
        return tenantId;
    }

    /**
     * @return human-readable reason for the suspension, or null
     */
    public String getReason() {
        return reason;
    }

    /**
     * @return timestamp when the tenant was suspended
     */
    public LocalDateTime getSuspendedAt() {
        return suspendedAt;
    }

    /**
     * @return identifier of the initiator, or null for automated policies
     */
    public String getSuspendedBy() {
        return suspendedBy;
    }

    // ── toString ──────────────────────────────────────────────

    @Override
    public String toString() {
        return "TenantSuspendedEvent{"
                + "eventId='" + getEventId() + '\''
                + ", tenantId='" + tenantId + '\''
                + ", reason='" + reason + '\''
                + ", suspendedAt=" + suspendedAt
                + ", suspendedBy='" + suspendedBy + '\''
                + '}';
    }
}
