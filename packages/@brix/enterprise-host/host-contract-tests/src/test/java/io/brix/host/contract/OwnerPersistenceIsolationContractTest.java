/*
 * Copyright 2026 Brix Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.brix.host.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import io.brix.platform.audit.core.entity.PlatformAuditLog;
import io.brix.platform.identity.entity.Identity;
import io.brix.platform.tenant.entity.Tenant;
import io.infra.adapter.idgen.IdgenAutoConfiguration;
import io.infra.adapter.persistence.jpa.config.JpaPersistenceAutoConfiguration;
import io.infra.adapter.persistence.jpa.config.TenantStatementVerifierAutoConfiguration;
import io.runtime.orchestrator.persistence.OwnerPersistenceProvider;
import io.runtime.orchestrator.persistence.PolicyAuditWriter;
import io.runtime.orchestrator.persistence.TenantAccessPolicy;

/**
 * The platform modules that declare owner persistence start under the tenant isolation of the
 * reference persistence adapter (root {@code BRX-RS-DATA-040}, multi-tenant §6.1).
 *
 * <p>The adapter classifies every table an owner maps as a tenant table, a registered global table
 * or the owner's own outbox and inbox, and stops the Host when a table fits none of them. This
 * check runs where the Host composes the modules, so a new entity is caught by the build rather
 * than at Host startup. It needs the mapping only, so no schema is created.</p>
 *
 * <p>The same composition must let the runtime record every cross-tenant policy use in the
 * platform audit (root {@code BRX-RS-DATA-047}).</p>
 */
class OwnerPersistenceIsolationContractTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(
            DataSourceAutoConfiguration.class,
            TenantStatementVerifierAutoConfiguration.class,
            HibernateJpaAutoConfiguration.class,
            JpaPersistenceAutoConfiguration.class,
            IdgenAutoConfiguration.class))
        .withUserConfiguration(PlatformEntities.class)
        .withPropertyValues(
            "spring.datasource.url=jdbc:h2:mem:owners-" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
            "spring.jpa.hibernate.ddl-auto=none",
            "brix.persistence.schema-validation=false");

    @Test
    void platformOwnersClassifyEveryTableTheyMap() {
        runner.run(context -> {
            assertThat(context.getStartupFailure()).isNull();
            OwnerPersistenceProvider owners = context.getBean(OwnerPersistenceProvider.class);

            assertThat(owners.forOwner("platform-tenant")).isPresent();
            assertThat(owners.forOwner("platform-identity")).isPresent();
            // The entity lives in platform-audit-core; the owner's manifest in -server lists that artifact.
            assertThat(owners.forOwner("platform-audit")).isPresent();
        });
    }

    @Test
    void thePlatformAuditOwnerLetsTheRuntimeRecordEveryPolicyUse() {
        runner.run(context -> {
            PolicyAuditWriter writer = context.getBean(PolicyAuditWriter.class);

            // Resolving the registration checks it against the packaged modules: one owner registers it with every
            // column the writer needs, its record schema resolves, an entity of that owner maps the table and the
            // Host's id generator gives numeric ids (root BRX-RS-DATA-045, MANIFEST-031, DATA-024). The runtime
            // refuses to start the Host otherwise.
            for (TenantAccessPolicy policy : TenantAccessPolicy.values()) {
                policy.auditAction().ifPresent(action -> assertThat(writer.covers(action)).as(action).isTrue());
            }
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EntityScan(basePackageClasses = {Tenant.class, Identity.class, PlatformAuditLog.class})
    static class PlatformEntities {
    }
}
