/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.repository;

import io.brix.enterprise.app.compliance.entity.ComplianceCheckResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link ComplianceCheckResultEntity}.
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@Repository
public interface ComplianceCheckResultRepository
        extends JpaRepository<ComplianceCheckResultEntity, String> {
}
