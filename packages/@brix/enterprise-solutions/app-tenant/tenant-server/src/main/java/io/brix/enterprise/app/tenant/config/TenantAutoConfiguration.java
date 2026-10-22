/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import io.brix.enterprise.app.tenant.domain.TenantRecord;
import io.brix.enterprise.app.tenant.repository.TenantRecordRepository;
import io.brix.enterprise.app.tenant.service.TenantManagementServiceImpl;

/**
 * Tenant plugin auto-configuration.
 *
 * <p>Registers app-tenant owned service, entity, and repository components.
 * Runtime Shell owns plugin discovery, lifecycle, capability resolution,
 * readiness, and HTTP endpoint publication through
 * {@link io.brix.enterprise.app.tenant.TenantPlugin}; this class does not
 * publish Spring MVC business controllers.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.10
 */
@AutoConfiguration
@ComponentScan(basePackageClasses = TenantManagementServiceImpl.class)
@EntityScan(basePackageClasses = TenantRecord.class)
@EnableJpaRepositories(basePackageClasses = TenantRecordRepository.class)
public class TenantAutoConfiguration {
}
