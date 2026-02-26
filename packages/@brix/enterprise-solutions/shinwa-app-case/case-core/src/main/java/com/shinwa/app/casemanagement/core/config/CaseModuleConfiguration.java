package com.shinwa.app.casemanagement.core.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Case Module Configuration Class
 * 
 * <p>Spring configuration entry point for the module, responsible for component scanning and JPA repository configuration.</p>
 * 
 * <p><b>v3.0 Architecture Notes:</b></p>
 * <ul>
 *   <li>As a Spring configuration class, automatically scanned and loaded by Host</li>
 *   <li>Configures component scanning scope to the current module package</li>
 *   <li>Configures JPA repository scanning</li>
 * </ul>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Configuration
@ComponentScan(basePackages = "com.shinwa.app.casemanagement.core")
@EnableJpaRepositories(basePackages = "com.shinwa.app.casemanagement.core.repository")
public class CaseModuleConfiguration {

    /**
     * Module ID constant
     * <p>Must match the id in module-manifest.yaml</p>
     */
    public static final String MODULE_ID = "shinwa-app-case";

    /**
     * Module version constant
     */
    public static final String MODULE_VERSION = "3.0.0-SNAPSHOT";
}
