package com.shinwa.app.casemanagement.api.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Case module Data Transfer Object.
 *
 * <p>Standard DTO for inter-module data transfer, containing basic business fields.</p>
 *
 * <p><strong>v3.0 Architecture Notes:</strong></p>
 * <ul>
 *   <li>DTO is placed in the api module for other modules to depend on</li>
 *   <li>Contains only data fields, no business logic</li>
 *   <li>Uses Lombok to simplify code</li>
 * </ul>
 *
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Unique identifier
     */
    private String id;

    /**
     * Case name
     */
    private String name;

    /**
     * Case description
     */
    private String description;

    /**
     * Case status.
     * <p>Possible values: DRAFT, ACTIVE, COMPLETED, CANCELLED</p>
     */
    private String status;

    /**
     * Tenant ID.
     * <p>Tenant identifier in multi-tenant architecture</p>
     */
    private String tenantId;

    /**
     * Creator ID
     */
    private String createdBy;

    /**
     * Creation timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updater ID
     */
    private String updatedBy;

    /**
     * Last update timestamp
     */
    private LocalDateTime updatedAt;
}
