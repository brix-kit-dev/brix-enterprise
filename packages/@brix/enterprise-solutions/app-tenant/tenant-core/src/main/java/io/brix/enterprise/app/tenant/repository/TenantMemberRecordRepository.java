/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import io.brix.enterprise.app.tenant.domain.TenantMemberRecord;

/**
 * Repository for app-tenant owned tenant membership records.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@Repository
public interface TenantMemberRecordRepository extends JpaRepository<TenantMemberRecord, Long> {

    /**
     * Lists tenant members in deterministic order.
     *
     * @param tenantId tenant id
     * @return member records
     */
    List<TenantMemberRecord> findByTenantIdOrderByIdAsc(Long tenantId);
}
