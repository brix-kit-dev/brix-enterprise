package com.shinwa.app.casemanagement.core.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDateTime;

/**
 * Case Entity
 * 
 * <p>Database persistence entity corresponding to the case table.</p>
 * 
 * <p><b>v3.0 Multi-tenancy Support:</b></p>
 * <ul>
 *   <li>Uses Hibernate Filter to implement tenant data isolation</li>
 *   <li>tenant_id field is automatically populated from TenantContext</li>
 *   <li>Queries automatically include tenant filtering condition</li>
 * </ul>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "case_record")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class CaseEntity {

    /**
     * Primary key ID
     * <p>Uses UUID generation strategy</p>
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    /**
     * Name
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Description
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Status
     * <p>Possible values: DRAFT, ACTIVE, COMPLETED, CANCELLED</p>
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * Tenant ID
     * <p>[v3.0 Multi-tenancy] Not nullable, used for data isolation</p>
     */
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    /**
     * Creator user ID
     */
    @Column(name = "created_by", length = 36)
    private String createdBy;

    /**
     * Creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last updater user ID
     */
    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    /**
     * Last update timestamp
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Automatically sets creation timestamp on insert.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /**
     * Automatically sets update timestamp on update.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
