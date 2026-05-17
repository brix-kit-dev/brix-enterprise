/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;

/**
 * Variable placeholder definition embedded in a script template.
 *
 * <p>Each variable is rendered as a form field when an agent uses the
 * template, allowing personalisation of the script content before use.</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Variable definition within a script template")
public record ScriptVariableDTO(

        @Schema(description = "Variable unique key, used as placeholder token in template content",
                example = "customerName")
        String key,

        @Schema(description = "Human-readable display label", example = "Customer Name")
        String label,

        @Schema(description = "Help text for the variable")
        String description,

        @Schema(description = "Default value pre-filled in the form")
        String defaultValue,

        @Schema(description = "Display order in the variable form", example = "1")
        int order

) implements Serializable {

    private static final long serialVersionUID = 1L;
}
