/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.repository;

import io.brix.enterprise.app.compliance.entity.ForbiddenWordEntity;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordCategory;
import io.brix.enterprise.app.compliance.enums.ForbiddenWordSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link ForbiddenWordEntity}.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Repository
public interface ForbiddenWordRepository extends JpaRepository<ForbiddenWordEntity, String> {

    /**
     * Queries forbidden words with optional filter criteria.
     *
     * @param word     partial word match (case-insensitive, nullable)
     * @param category exact category match (nullable)
     * @param severity exact severity match (nullable)
     * @param enabled  enabled filter (nullable)
     * @param pageable pagination parameters
     * @return a page of matching entities
     */
    @Query("""
            SELECT fw FROM ForbiddenWordEntity fw
            WHERE (:word IS NULL OR LOWER(fw.word) LIKE LOWER(CONCAT('%', :word, '%')))
              AND (:category IS NULL OR fw.category = :category)
              AND (:severity IS NULL OR fw.severity = :severity)
              AND (:enabled IS NULL OR fw.enabled = :enabled)
            """)
    Page<ForbiddenWordEntity> findByFilters(
            @Param("word") String word,
            @Param("category") ForbiddenWordCategory category,
            @Param("severity") ForbiddenWordSeverity severity,
            @Param("enabled") Boolean enabled,
            Pageable pageable);

    /**
     * Finds all active (enabled) forbidden word rules, used by the
     * compliance checking engine.
     *
     * @return list of enabled rules
     */
    List<ForbiddenWordEntity> findByEnabledTrue();
}
