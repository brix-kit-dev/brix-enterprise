/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for creating a checklist item.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Create Checklist Item Request")
public class CreateChecklistItemRequest {

    /**
     * Item code.
     */
    @NotBlank(message = "Item code is required")
    @Schema(description = "Item code", example = "DOC-001")
    private String itemCode;

    /**
     * Item name.
     */
    @NotBlank(message = "Name is required")
    @Schema(description = "Item name", example = "Medical History Report")
    private String name;

    /**
     * Item description.
     */
    @Schema(description = "Item description")
    private String description;

    /**
     * Document category.
     */
    @Schema(description = "Category", example = "MEDICAL_RECORDS")
    private String category;

    /**
     * Whether this item is required.
     */
    @Schema(description = "Is required", example = "true")
    private Boolean required;

    /**
     * Sort order.
     */
    @Schema(description = "Sort order", example = "1")
    private Integer sortOrder;

    /**
     * Accepted file formats (comma-separated).
     */
    @Schema(description = "Accepted formats", example = "PDF,JPG,PNG")
    private String acceptedFormats;

    /**
     * Maximum file size in bytes.
     */
    @Schema(description = "Max file size", example = "10485760")
    private Long maxFileSize;

    /**
     * Minimum number of files.
     */
    @Schema(description = "Min files", example = "1")
    private Integer minFiles;

    /**
     * Maximum number of files.
     */
    @Schema(description = "Max files", example = "5")
    private Integer maxFiles;

    /**
     * Sample document URL.
     */
    @Schema(description = "Sample document URL")
    private String sampleDocumentUrl;

    /**
     * Help text for customer.
     */
    @Schema(description = "Help text")
    private String helpText;

    /**
     * Validation rules in JSON format.
     */
    @Schema(description = "Validation rules")
    private String validationRules;
}
