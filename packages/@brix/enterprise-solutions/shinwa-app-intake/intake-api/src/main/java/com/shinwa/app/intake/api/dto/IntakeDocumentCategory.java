/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Intake Document Category Enumeration.
 * <p>
 * Defines categories for organizing required documents.
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Schema(description = "Intake document category")
public enum IntakeDocumentCategory {

    /**
     * Medical records (history, diagnoses, etc.).
     */
    @Schema(description = "Medical records")
    MEDICAL_RECORDS,

    /**
     * Identity documents (passport, ID card, etc.).
     */
    @Schema(description = "Identity documents")
    IDENTITY,

    /**
     * Insurance documents.
     */
    @Schema(description = "Insurance documents")
    INSURANCE,

    /**
     * Financial documents (bank statements, etc.).
     */
    @Schema(description = "Financial documents")
    FINANCIAL,

    /**
     * Legal documents (contracts, consents, etc.).
     */
    @Schema(description = "Legal documents")
    LEGAL,

    /**
     * Imaging documents (X-ray, MRI, CT, etc.).
     */
    @Schema(description = "Medical imaging")
    IMAGING,

    /**
     * Lab results (blood tests, etc.).
     */
    @Schema(description = "Laboratory results")
    LAB_RESULTS,

    /**
     * Prescriptions and medication records.
     */
    @Schema(description = "Prescriptions")
    PRESCRIPTIONS,

    /**
     * Other/miscellaneous documents.
     */
    @Schema(description = "Other documents")
    OTHER
}
