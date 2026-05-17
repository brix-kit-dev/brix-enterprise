/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.casemanagement.core.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
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
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 */
@Configuration
@ComponentScan(basePackages = "io.brix.enterprise.app.casemanagement.core")
@EntityScan(basePackages = "io.brix.enterprise.app.casemanagement.core.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.casemanagement.core.repository")
public class CaseModuleConfiguration {

    /**
     * Module ID constant
     * <p>Must match the id in META-INF/plugin-manifest.json</p>
     */
    public static final String MODULE_ID = "brix-app-case";

    /**
     * Module version constant
     */
    public static final String MODULE_VERSION = "3.0.0-SNAPSHOT";
}
