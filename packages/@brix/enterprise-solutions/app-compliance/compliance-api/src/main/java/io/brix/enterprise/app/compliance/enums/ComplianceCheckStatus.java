/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Overall result status of a compliance check execution.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ComplianceCheckStatus {

    /** All checks passed; no forbidden words detected. */
    PASS,

    /** Low/medium severity matches found; content allowed with warnings. */
    WARNING,

    /** High/critical severity matches found; content blocked. */
    FAIL
}
