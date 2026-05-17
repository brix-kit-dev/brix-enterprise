/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Lifecycle status of a {@link io.brix.enterprise.app.compliance.dto.ScriptTemplateDTO}.
 *
 * <p>The state machine follows a linear workflow:
 * {@code DRAFT → PENDING_REVIEW → PUBLISHED → DEPRECATED → ARCHIVED}.
 * Only {@code PUBLISHED} templates are visible to call-centre agents.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ScriptTemplateStatus {

    /** Initial editing state; not yet submitted for review. */
    DRAFT,

    /** Submitted for review by a compliance officer. */
    PENDING_REVIEW,

    /** Approved and available for use by agents. */
    PUBLISHED,

    /** Superseded by a newer version; no longer recommended. */
    DEPRECATED,

    /** Permanently retired; hidden from all listings. */
    ARCHIVED
}
