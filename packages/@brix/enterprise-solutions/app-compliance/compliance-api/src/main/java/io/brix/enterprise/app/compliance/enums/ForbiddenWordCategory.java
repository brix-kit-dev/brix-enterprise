/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.enums;

/**
 * Category of a forbidden word or phrase.
 *
 * <p>Categories align with regulatory and internal compliance
 * requirements for the medical-tourism domain.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
public enum ForbiddenWordCategory {

    /** Words that may create legal liability. */
    LEGAL_RISK,

    /** Misleading claims or exaggerated statements. */
    MISLEADING,

    /** Unfounded promises of outcomes or guarantees. */
    PROMISE,

    /** Discriminatory or exclusionary language. */
    DISCRIMINATION,

    /** Negative references to competitor products/services. */
    COMPETITOR,

    /** Sensitive personal or medical information. */
    SENSITIVE,

    /** Profane or unprofessional language. */
    PROFANITY
}
