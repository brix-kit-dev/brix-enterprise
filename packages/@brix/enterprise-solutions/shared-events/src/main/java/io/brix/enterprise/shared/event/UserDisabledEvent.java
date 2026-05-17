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
 * Integration event published when a user account is disabled.
 *
 * <h3>Publisher</h3>
 * <p>Published by the <strong>identity</strong> plugin when an administrator
 * disables a user account via the user-management API.</p>
 *
 * <h3>Expected Subscribers</h3>
 * <ul>
 *   <li><strong>booking</strong> — cancel all pending bookings for the disabled user</li>
 *   <li><strong>messenger</strong> — send an account-disabled notification</li>
 *   <li><strong>audit</strong> — record the account-disabled audit trail</li>
 *   <li><strong>session</strong> — force logout for all active sessions</li>
 * </ul>
 *
 * <h3>Idempotency</h3>
 * <p>Consumers should implement idempotent handling keyed on
 * {@link #getEventId()} to tolerate at-least-once delivery.</p>
 *
 * <h3>Routing</h3>
 * <p>Routing key format: {@code identity.user.<userId>}.  This allows
 * topic-based subscribers to filter by specific user or wildcard.</p>
 *
 * <h3>Guaranteed Delivery</h3>
 * <p>Annotated with {@link CriticalEvent} to route through the Outbox pattern,
 * ensuring at-least-once transactional delivery.  Disabling a user is an
 * irreversible security action; downstream subscribers (session invalidation,
 * booking cancellation) must not miss this event (R13.4 compliance).</p>
 *
 * <h3>Migration Note (R8.1)</h3>
 * <p>This class was originally defined in {@code identity-api}
 * ({@code io.brix.enterprise.app.identity.event.UserDisabledEvent}).
 * It has been relocated to the {@code shared-events} module to eliminate
 * the cross-plugin compile-time dependency from booking-core to
 * identity-api.  The original class in identity-api is now deprecated
 * and delegates to this canonical definition.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see io.runtime.sdk.event.IntegrationEvent
 * @see CriticalEvent
 */
@CriticalEvent
@SchemaVersion(value = 1, minCompatible = 1)
public class UserDisabledEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;

    /** Source module identifier used in the IntegrationEvent base class. */
    private static final String SOURCE_MODULE = "brix-app-identity";

    // ── Payload fields ────────────────────────────────────────

    /** The unique identifier of the disabled user. */
    private final String userId;

    /** The tenant to which the disabled user belongs. */
    private final String tenantId;

    /** Human-readable reason for the account disabling. */
    private final String reason;

    /** Timestamp when the user account was disabled. */
    private final LocalDateTime disabledAt;

    /** Identifier of the administrator who performed the disable action. */
    private final String disabledBy;

    // ── Constructor ───────────────────────────────────────────

    /**
     * Construct a new UserDisabledEvent.
     *
     * <p>The {@code tenantId} is passed to the {@link IntegrationEvent} base class
     * so that EventBus adapters can enforce tenant-level routing and filtering
     * without inspecting the payload (R3.6 compliance).</p>
     *
     * @param userId     unique identifier of the disabled user (required)
     * @param tenantId   tenant this user belongs to (required)
     * @param reason     human-readable reason for disabling (may be null)
     * @param disabledAt timestamp when the account was disabled (required)
     * @param disabledBy identifier of the admin who performed the action (may be null for system actions)
     */
    public UserDisabledEvent(String userId,
                             String tenantId,
                             String reason,
                             LocalDateTime disabledAt,
                             String disabledBy) {
        super(SOURCE_MODULE, tenantId);
        this.userId = userId;
        this.tenantId = tenantId;
        this.reason = reason;
        this.disabledAt = disabledAt;
        this.disabledBy = disabledBy;
    }

    // ── IntegrationEvent contract ─────────────────────────────

    /**
     * Returns the routing key for topic-based event distribution.
     *
     * <p>Format: {@code identity.user.<userId>}</p>
     *
     * @return routing key string
     */
    @Override
    public String getRoutingKey() {
        return "identity.user." + userId;
    }

    // ── Getters ───────────────────────────────────────────────

    /**
     * @return unique identifier of the disabled user
     */
    public String getUserId() {
        return userId;
    }

    /**
     * @return tenant identifier
     */
    public String getTenantId() {
        return tenantId;
    }

    /**
     * @return human-readable reason for the account disabling, or null
     */
    public String getReason() {
        return reason;
    }

    /**
     * @return timestamp when the user account was disabled
     */
    public LocalDateTime getDisabledAt() {
        return disabledAt;
    }

    /**
     * @return identifier of the admin who disabled the account, or null for system actions
     */
    public String getDisabledBy() {
        return disabledBy;
    }

    // ── toString ──────────────────────────────────────────────

    @Override
    public String toString() {
        return "UserDisabledEvent{"
                + "eventId='" + getEventId() + '\''
                + ", userId='" + userId + '\''
                + ", tenantId='" + tenantId + '\''
                + ", reason='" + reason + '\''
                + ", disabledAt=" + disabledAt
                + ", disabledBy='" + disabledBy + '\''
                + '}';
    }
}
