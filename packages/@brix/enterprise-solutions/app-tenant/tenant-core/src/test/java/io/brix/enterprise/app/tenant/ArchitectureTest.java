/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Architecture constraint test for the Tenant module.
 * Uses BrixArchitectureRules.coreProfileV2() from the shared Architecture Guard
 * library and tenant-specific v3.0.10 guards.
 *
 * @author Brix Architecture Team
 * @since 3.1.0
 */
package io.brix.enterprise.app.tenant;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Tenant module architecture constraint test.
 *
 * <p>Automatically enables all 8 architecture red-line guards.
 * Any code commit violating these constraints will cause {@code mvn test} to fail.</p>
 */
@AnalyzeClasses(packages = "io.brix.enterprise.app.tenant")
class ArchitectureTest {

    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.coreProfileV2();

    @ArchTest
    static final com.tngtech.archunit.lang.ArchRule tenantCoreMustNotDependOnRuntimeShellInternals =
        noClasses()
            .should().dependOnClassesThat().resideInAnyPackage(
                "io.runtime.orchestrator..",
                "io.runtime.sdk.context..",
                "io.runtime.sdk.support..")
            .because("tenant-core is plugin-core and may depend only on capability contracts");
}
