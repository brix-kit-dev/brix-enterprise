/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Minimal Spring Boot application context for E2E integration tests.
 *
 * Scans:
 *   - io.brix.enterprise  — enterprise solution packages (tenant, identity, …)
 *   - io.brix.platform    — platform-commons auto-configurations
 *
 * Used automatically by @SpringBootTest within this test module because
 * there is no other @SpringBootApplication class in the test classpath.
 *
 * @author Brix Platform Team
 * @version 3.2.0-SNAPSHOT
 * @since 2026-07-15
 */
package io.brix.enterprise.e2e;

import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Test entry point that activates Spring Boot auto-configuration for E2E tests.
 *
 * <p>Scan roots cover both the enterprise solution layer and the platform
 * layer so that auto-configurations in {@code platform-auth-servlet} and
 * {@code platform-auth-web} are discovered and registered.</p>
 */
@SpringBootApplication(
        scanBasePackages = {
                "io.brix.enterprise",
                "io.brix.platform"
        }
)
class E2ETestApplication {
    // intentionally empty — bootstraps the Spring context for @SpringBootTest
}
