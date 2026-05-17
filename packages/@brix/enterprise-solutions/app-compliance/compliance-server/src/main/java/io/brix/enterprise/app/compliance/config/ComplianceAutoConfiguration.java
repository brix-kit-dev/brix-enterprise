/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.compliance.config;

import io.runtime.sdk.context.RuntimeContext;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Spring Boot auto-configuration for the Compliance module.
 *
 * <p>Automatically activated when the compliance-server jar is on the
 * classpath. Configures:</p>
 * <ul>
 *   <li>Component scanning for controllers, services, and event handlers</li>
 *   <li>JPA entity scanning for {@code entity} package</li>
 *   <li>JPA repository scanning for {@code repository} package</li>
 * </ul>
 *
 * <h3>Prerequisites</h3>
 * <p>Requires a {@link RuntimeContext} bean to be available in the
 * application context (provided by the Runtime Shell Host).</p>
 *
 * @author Brix Architecture Team
 * @since 3.2.0
 */
@AutoConfiguration
@ComponentScan(basePackages = "io.brix.enterprise.app.compliance")
@EntityScan(basePackages = "io.brix.enterprise.app.compliance.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.compliance.repository")
public class ComplianceAutoConfiguration {
}
