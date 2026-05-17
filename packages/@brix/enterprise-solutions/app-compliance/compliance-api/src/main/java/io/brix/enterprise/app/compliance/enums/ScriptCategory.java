/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Functional category of a script template.
 *
 * <p>Each category maps to a specific phase of the customer interaction
 * lifecycle, allowing supervisors to organise and search templates by
 * business purpose.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ScriptCategory {

    /** Opening greeting / ice-breaker. */
    OPENING,

    /** Product or service introduction. */
    INTRODUCTION,

    /** Handling customer objections and concerns. */
    OBJECTION_HANDLING,

    /** Closing / deal-sealing phrases. */
    CLOSING,

    /** Follow-up and return-visit scripts. */
    FOLLOW_UP,

    /** Complaint handling and escalation scripts. */
    COMPLAINT_HANDLING,

    /** General-purpose / uncategorised scripts. */
    GENERIC
}
