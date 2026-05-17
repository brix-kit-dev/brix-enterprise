/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.identity.event;

import java.time.LocalDateTime;

/**
 * Legacy location of the UserDisabledEvent integration event.
 *
 * <p><strong>DEPRECATED — use
 * {@link io.brix.enterprise.shared.event.UserDisabledEvent} instead.</strong></p>
 *
 * <p>This class is retained solely for source-level backward compatibility
 * within the identity plugin.  It extends the canonical definition in
 * {@code shared-events} so that existing code referencing this package
 * still compiles.  New code should always import from
 * {@code io.brix.enterprise.shared.event}.</p>
 *
 * <h3>Migration (R8.1)</h3>
 * <p>Cross-plugin integration events must reside in the {@code shared-events}
 * module so that subscribing plugins do not take a compile-time dependency
 * on the publishing plugin's API module.  See the architecture review
 * report §R8.1 and the Runtime Shell Blueprint §4 (Plugin isolation).</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @deprecated Use {@link io.brix.enterprise.shared.event.UserDisabledEvent}.
 *             This class will be removed in a future release.
 */
@Deprecated(since = "3.2.0", forRemoval = true)
public class UserDisabledEvent extends io.brix.enterprise.shared.event.UserDisabledEvent {

    private static final long serialVersionUID = 1L;

    /**
     * Construct a UserDisabledEvent (delegates to the shared-events canonical class).
     *
     * @param userId     unique identifier of the disabled user
     * @param tenantId   tenant this user belongs to
     * @param reason     human-readable reason for disabling
     * @param disabledAt timestamp when the account was disabled
     * @param disabledBy identifier of the admin who performed the action
     * @deprecated Use {@code new io.brix.enterprise.shared.event.UserDisabledEvent(...)} directly.
     */
    @Deprecated(since = "3.2.0", forRemoval = true)
    public UserDisabledEvent(String userId, String tenantId, String reason,
                             LocalDateTime disabledAt, String disabledBy) {
        super(userId, tenantId, reason, disabledAt, disabledBy);
    }
}
