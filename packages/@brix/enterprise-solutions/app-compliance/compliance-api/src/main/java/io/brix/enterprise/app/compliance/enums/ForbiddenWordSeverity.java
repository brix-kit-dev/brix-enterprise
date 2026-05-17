/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Severity level of a forbidden word or phrase.
 *
 * <p>Severity determines the automatic action taken when a match is
 * detected during a compliance check:</p>
 * <ul>
 *   <li>{@link #LOW}      — informational; no automatic block</li>
 *   <li>{@link #MEDIUM}   — warning shown to the agent</li>
 *   <li>{@link #HIGH}     — requires supervisor override</li>
 *   <li>{@link #CRITICAL} — hard block; content cannot be sent</li>
 * </ul>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ForbiddenWordSeverity {

    /** Informational; logged but does not trigger a block. */
    LOW,

    /** Warning displayed to the agent. */
    MEDIUM,

    /** High-risk; requires a supervisor override to proceed. */
    HIGH,

    /** Critical violation; the content is automatically blocked. */
    CRITICAL
}
