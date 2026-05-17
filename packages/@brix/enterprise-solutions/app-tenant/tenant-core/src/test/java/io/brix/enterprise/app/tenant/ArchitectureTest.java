/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Architecture constraint test for the Tenant module.
 * Uses BrixArchitectureRules.pluginProfile() from the shared Architecture Guard
 * library to enforce all 8 architecture red-line rules.
 *
 * @author Brix Architecture Team
 * @since 3.1.0
 */
package io.brix.enterprise.app.tenant;

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
}
