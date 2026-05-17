/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Communication channel to which a script template applies.
 *
 * <p>A template can be tagged with one scenario, or {@link #ALL} to
 * indicate it is channel-agnostic.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ScriptScenario {

    /** Outbound / inbound telephone sales. */
    PHONE_SALES,

    /** Telephone customer service. */
    PHONE_SERVICE,

    /** Online chat (web / app). */
    ONLINE_CHAT,

    /** In-person meetings or consultations. */
    IN_PERSON,

    /** Email communication. */
    EMAIL,

    /** All channels — omni-channel template. */
    ALL
}
