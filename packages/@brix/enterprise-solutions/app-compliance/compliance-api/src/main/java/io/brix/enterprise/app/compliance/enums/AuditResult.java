/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Result of a compliance audit action.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum AuditResult {

    /** Content passed compliance review. */
    PASS,

    /** Content failed compliance review. */
    FAIL,

    /** Compliance failure overridden by authorised personnel. */
    OVERRIDE
}
