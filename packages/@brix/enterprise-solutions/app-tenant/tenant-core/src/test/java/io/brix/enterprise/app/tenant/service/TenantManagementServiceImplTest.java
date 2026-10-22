/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import io.brix.enterprise.app.tenant.domain.TenantRecord;
import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.exception.TenantAlreadyExistsException;
import io.brix.enterprise.app.tenant.repository.TenantRecordRepository;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;

/**
 * Verifies the app-tenant transactional business closure.
 *
 * @author Brix Platform Team
 * @since 3.2.0
 */
@DataJpaTest
@Import(TenantManagementServiceImpl.class)
class TenantManagementServiceImplTest {

    @Autowired
    private TenantManagementService tenantManagementService;

    @Test
    void createTenantPersistsTenantAndOwnerMembership() {
        TenantDTO created = tenantManagementService.createTenant(request("acme-corp", "Acme Corporation", 1001L));

        assertThat(created.getId()).isNotNull();
        assertThat(created.getCode()).isEqualTo("acme-corp");
        assertThat(created.getStatus()).isEqualTo("PENDING_ACTIVATION");
        assertThat(tenantManagementService.listTenants()).extracting(TenantDTO::getCode)
            .containsExactly("acme-corp");
        assertThat(tenantManagementService.getTenantById(created.getId()).getName()).isEqualTo("Acme Corporation");
        assertThat(tenantManagementService.listMembers(created.getId()))
            .hasSize(1)
            .first()
            .satisfies(member -> {
                assertThat(member.getIdentityId()).isEqualTo(1001L);
                assertThat(member.getMemberType()).isEqualTo("OWNER");
                assertThat(member.getStatus()).isEqualTo("ACTIVE");
            });
    }

    @Test
    void duplicateTenantCodeFailsFast() {
        tenantManagementService.createTenant(request("acme-corp", "Acme Corporation", 1001L));

        assertThatThrownBy(() -> tenantManagementService.createTenant(
            request("acme-corp", "Acme Duplicate", 1002L)))
            .isInstanceOf(TenantAlreadyExistsException.class)
            .hasMessageContaining("acme-corp");
    }

    @Test
    void activateAndSuspendChangeTenantStatus() {
        TenantDTO created = tenantManagementService.createTenant(request("acme-corp", "Acme Corporation", 1001L));

        assertThat(tenantManagementService.activateTenant(created.getId()).getStatus()).isEqualTo("ACTIVE");
        assertThat(tenantManagementService.suspendTenant(created.getId()).getStatus()).isEqualTo("SUSPENDED");
    }

    private static CreateTenantRequest request(String code, String name, Long ownerIdentityId) {
        CreateTenantRequest request = new CreateTenantRequest();
        request.setCode(code);
        request.setName(name);
        request.setOwnerIdentityId(ownerIdentityId);
        request.setContactEmail("owner@example.com");
        return request;
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackageClasses = TenantRecord.class)
    @EnableJpaRepositories(basePackageClasses = TenantRecordRepository.class)
    @Import(TenantManagementServiceImpl.class)
    static class TestApplication {
    }
}
