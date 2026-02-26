package com.shinwa.app.casemanagement.api.request;

import java.io.Serializable;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Update Case Request Object
 * 
 * <p>Used to receive API request parameters for updating a Case.</p>
 * 
 * <p><b>v3.0 Architecture Notes:</b></p>
 * <ul>
 *   <li>Request objects are placed in the api module</li>
 *   <li>Uses Jakarta Validation for parameter validation</li>
 *   <li>All fields are optional for partial update support</li>
 *   <li>Separated from DTO: Request is for input, DTO is for output</li>
 * </ul>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCaseRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Name
     * <p>Optional, length 1-100 characters if provided</p>
     */
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;

    /**
     * Description
     * <p>Optional, maximum 500 characters</p>
     */
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    /**
     * Status
     * <p>Optional, valid values: DRAFT, ACTIVE, COMPLETED, CANCELLED</p>
     */
    @Size(max = 50, message = "Status must not exceed 50 characters")
    private String status;
}
