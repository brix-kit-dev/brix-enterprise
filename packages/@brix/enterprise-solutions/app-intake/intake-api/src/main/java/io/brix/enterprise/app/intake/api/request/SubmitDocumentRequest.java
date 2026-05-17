/*
 * Copyright 2026 Brix Platform Team.
 * All rights reserved.
 */
package io.brix.enterprise.app.intake.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for submitting a document to a checklist item.
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Submit Document Request")
public class SubmitDocumentRequest {

    /**
     * Checklist item ID.
     */
    @NotNull(message = "Item ID is required")
    @Schema(description = "Checklist item ID", example = "10001")
    private Long itemId;

    /**
     * File ID from storage service.
     */
    @NotBlank(message = "File ID is required")
    @Schema(description = "Uploaded file ID", example = "file-uuid-1234")
    private String fileId;

    /**
     * Original file name.
     */
    @NotBlank(message = "File name is required")
    @Schema(description = "File name", example = "medical_history.pdf")
    private String fileName;

    /**
     * File size in bytes.
     */
    @Schema(description = "File size in bytes", example = "1048576")
    private Long fileSize;

    /**
     * File MIME type.
     */
    @Schema(description = "MIME type", example = "application/pdf")
    private String mimeType;

    /**
     * Customer notes about the submission.
     */
    @Schema(description = "Submission notes")
    private String notes;
}
