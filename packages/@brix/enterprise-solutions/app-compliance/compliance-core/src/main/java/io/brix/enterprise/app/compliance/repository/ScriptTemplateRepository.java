/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.repository;

import io.brix.enterprise.app.compliance.entity.ScriptTemplateEntity;
import io.brix.enterprise.app.compliance.enums.ScriptCategory;
import io.brix.enterprise.app.compliance.enums.ScriptScenario;
import io.brix.enterprise.app.compliance.enums.ScriptTemplateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link ScriptTemplateEntity}.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Repository
public interface ScriptTemplateRepository extends JpaRepository<ScriptTemplateEntity, String> {

    /**
     * Queries script templates with optional filter criteria.
     *
     * <p>Each filter parameter is optional (pass {@code null} to skip).
     * Filters are combined with AND logic.</p>
     *
     * @param name     partial name match (case-insensitive, nullable)
     * @param category exact category match (nullable)
     * @param scenario exact scenario match (nullable)
     * @param status   exact status match (nullable)
     * @param pageable pagination parameters
     * @return a page of matching entities
     */
    @Query("""
            SELECT t FROM ScriptTemplateEntity t
            WHERE (:name IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :name, '%')))
              AND (:category IS NULL OR t.category = :category)
              AND (:scenario IS NULL OR t.scenario = :scenario)
              AND (:status IS NULL OR t.status = :status)
            """)
    Page<ScriptTemplateEntity> findByFilters(
            @Param("name") String name,
            @Param("category") ScriptCategory category,
            @Param("scenario") ScriptScenario scenario,
            @Param("status") ScriptTemplateStatus status,
            Pageable pageable);

    /**
     * Checks whether a template with the given business code already exists.
     *
     * @param code the template code
     * @return true if a template with this code exists
     */
    boolean existsByCode(String code);
}
