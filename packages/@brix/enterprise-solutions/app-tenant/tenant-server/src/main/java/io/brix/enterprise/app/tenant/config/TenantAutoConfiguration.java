/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * Tenant Module Auto-Configuration.
 *
 * <p>Spring Boot auto-configuration class that automatically discovers
 * and registers tenant module components when included in a Host assembly.</p>
 *
 * <h3>Auto-configured Components</h3>
 * <ul>
 *   <li>TenantManagementController — REST API endpoints</li>
 *   <li>TenantManagementService implementation (from tenant-core)</li>
 * </ul>
 *
 * <h3>Usage</h3>
 * <p>Include {@code tenant-server} as a dependency in the Host assembly.
 * The auto-configuration will be picked up via
 * {@code META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "io.brix.enterprise.app.tenant.controller",
    "io.brix.enterprise.app.tenant.service"
})
public class TenantAutoConfiguration {
}
