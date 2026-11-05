/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Architecture Constraint Tests for Intake Module
 * 
 * This test file enforces all 8 Brix Architecture Guard redlines as defined
 * in the v3.0.4 Runtime Shell Architecture Blueprint:
 * 
 *   Redline 1: No direct dependencies on infrastructure adapters
 *              Plugin modules must not import adapter implementation classes.
 *              
 *   Redline 2: No direct use of Kafka/Redis middleware clients
 *              All messaging must go through EventBusCapability.
 *              All caching must go through StateStoreCapability.
 *              
 *   Redline 3: No RestTemplate/WebClient for calling other services
 *              All HTTP calls must use HttpCapability.
 *              
 *   Redline 4: Cross-module communication must go through Capability interfaces
 *              No direct module-to-module dependencies.
 *              
 *   Redline 5: No dependencies on Spring container specific APIs
 *              Business logic must be container-agnostic.
 *              
 *   Redline 6: Configuration must be obtained via ConfigStoreCapability
 *              No direct @Value or Environment access in business logic.
 *              
 *   Redline 7: Logging standards enforcement
 *              Domain/Entity layers must not use LoggerFactory directly.
 *              Use ObservabilityCapability for structured logging.
 *              
 *   Redline 8: Events must be published via EventBusCapability
 *              No direct KafkaTemplate or RabbitTemplate usage.
 *
 * Any code violating these redlines will cause build failure.
 * 
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-24
 */
package io.brix.enterprise.app.intake;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Intake Module Architecture Constraint Tests
 *
 * <p>This test class automatically enables all 8 architecture redline guards
 * from the Brix Architecture Guard library. The guards are applied to all
 * classes within the {@code io.brix.enterprise.app.intake} package hierarchy.</p>
 *
 * <p><b>Guard Profiles Available:</b></p>
 * <ul>
 *   <li>{@code pluginProfile()} - For business plugin modules (strictest rules)</li>
 *   <li>{@code hostProfile()} - For Host layer modules (relaxed infrastructure rules)</li>
 *   <li>{@code infraProfile()} - For infrastructure adapter modules (most relaxed)</li>
 * </ul>
 *
 * <p><b>Usage:</b></p>
 * <ul>
 *   <li>Run via Maven: {@code mvn test -Dtest=ArchitectureTest}</li>
 *   <li>Run via IDE: Right-click and run as JUnit test</li>
 * </ul>
 *
 * <p><b>Violation Fix Guide:</b></p>
 * <ol>
 *   <li>Identify the violated redline from test output</li>
 *   <li>Locate the offending import/dependency</li>
 *   <li>Replace with the corresponding Capability interface call</li>
 *   <li>Inject Capability via RuntimeContext, not direct DI</li>
 * </ol>
 *
 * @see BrixArchitectureRules for rule implementations
 * @see <a href="docs/README.md">The blueprints in force</a>
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-24
 */
@AnalyzeClasses(packages = "io.brix.enterprise.app.intake")
class ArchitectureTest {

    /**
     * Imports all architecture rules from Brix Architecture Guard.
     * 
     * <p>The plugin profile is used because this is a business plugin module,
     * which requires the strictest architecture enforcement.</p>
     * 
     * <p>Each rule in the profile corresponds to one of the 8 architecture
     * redlines. See {@link BrixArchitectureRules#coreProfileV2()} for details.</p>
     */
    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.coreProfileV2();
}
