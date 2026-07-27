/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import io.brix.enterprise.app.tenant.domain.TenantRecord;

/**
 * Repository for app-tenant owned tenant directory records.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@Repository
public interface TenantRecordRepository extends JpaRepository<TenantRecord, Long> {

    /**
     * Finds a tenant by code.
     *
     * @param code tenant code
     * @return tenant record
     */
    Optional<TenantRecord> findByCode(String code);

    /**
     * Returns whether a tenant code already exists.
     *
     * @param code tenant code
     * @return true when the code exists
     */
    boolean existsByCode(String code);

    /**
     * Lists tenants ordered by code for deterministic API responses.
     *
     * @return tenant records
     */
    List<TenantRecord> findAllByOrderByCodeAsc();
}
