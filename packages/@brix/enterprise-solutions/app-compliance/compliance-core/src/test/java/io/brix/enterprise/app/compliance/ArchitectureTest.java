/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Architecture Constraint Test — wired into Brix Architecture Guard
 * shared rule library. Replaces ad-hoc layer dependency tests with
 * the standard pluginProfile() covering all 8 architecture red lines.
 *
 * Red lines enforced by pluginProfile():
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * R1: Plugin depends only on runtime-sdk-api (no Host, no infra-adapter)
 * R2: No direct Spring Security imports (use AuthCapability)
 * R3: No direct infrastructure imports (Kafka, Redis, RabbitMQ, etc.)
 * R4: Controller → Service → Repository layering discipline
 * R5: plugin-manifest.json and ArchitectureTest must exist
 * R6: Integration events must extend IntegrationEvent
 * R7: No cross-plugin compile-time dependencies
 * R8: Shared events must reside in shared-events module
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
package io.brix.enterprise.app.compliance;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Compliance module architecture constraint test.
 *
 * <p>Automatically enables all 8 architecture red-line guards.
 * Any violation will cause {@code mvn test} to fail, preventing
 * non-compliant code from being merged.</p>
 */
@AnalyzeClasses(packages = "io.brix.enterprise.app.compliance")
class ArchitectureTest {

    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.coreProfileV2();
}
