/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Action type recorded in a compliance audit trail entry.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum AuditAction {

    /** Automated or manual compliance check. */
    CHECK,

    /** Content approved by a compliance officer. */
    APPROVE,

    /** Content rejected by a compliance officer. */
    REJECT,

    /** Compliance violation overridden by a supervisor. */
    OVERRIDE
}
