/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake.core.config;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Intake Module Spring Configuration.
 * <p>
 * Configures component scanning, JPA repositories, and entity scanning
 * for the intake module.
 * </p>
 *
 * <p><b>v3.0.4 Architecture Compliance:</b></p>
 * <ul>
 *   <li>Configuration is auto-discovered via component scanning</li>
 *   <li>No infrastructure-specific configuration (handled by Host)</li>
 *   <li>Pure Spring Boot configuration</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Configuration
@EnableAutoConfiguration
@ComponentScan(basePackages = "com.shinwa.app.intake.core")
@EnableJpaRepositories(basePackages = "com.shinwa.app.intake.core.repository")
@EntityScan(basePackages = "com.shinwa.app.intake.core.domain")
public class IntakeModuleConfiguration {
    // Module configuration - beans will be auto-configured
}
