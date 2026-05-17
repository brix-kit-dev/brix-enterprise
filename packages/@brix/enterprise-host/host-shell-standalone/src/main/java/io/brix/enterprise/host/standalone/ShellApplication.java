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
package io.brix.enterprise.host.standalone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Brix Enterprise standalone mode shell entry point.
 * 
 * <p>This is the unified entry point for standalone product mode (Standalone Mode),
 * assembling the following components:</p>
 * <ul>
 *   <li><b>Full Runtime Capabilities</b> - Kafka EventBus, Redis StateStore, OTel observability</li>
 *   <li><b>Business Modules</b> - app-* series plugins (identity, booking, products, etc.)</li>
 *   <li><b>Platform Services</b> - Authentication, Gateway, Config Center, etc.</li>
 * </ul>
 * 
 * <h2>Discovery Strategy</h2>
 * <p>The shell does not declare package scans. Runtime capabilities and plugin
 * server modules are assembled through Maven dependencies, Spring Boot
 * auto-configuration imports, plugin manifests, and YAML configuration.</p>
 * 
 * <h2>Package Rename (v3.0.9)</h2>
 * <p>Package renamed from {@code io.host.shell.standalone} to {@code io.brix.enterprise.host.standalone}
 * to align with the Brix naming convention. The start-class and
 * AutoConfiguration.imports entries have been updated accordingly.</p>
 * 
 * <h2>Startup Commands</h2>
 * <pre>
 * java -jar host-shell-standalone.jar --spring.profiles.active=standalone
 * </pre>
 * 
 * <h2>Docker Startup</h2>
 * <pre>
 * docker run -p 8081:8081 brix/host-shell-standalone:3.0.0-SNAPSHOT
 * </pre>
 * 
 * <h2>Configuration Priority</h2>
 * <ol>
 *   <li>Command line arguments</li>
 *   <li>Environment variables</li>
 *   <li>application-standalone.yml</li>
 *   <li>application.yml</li>
 * </ol>
 * 
 * @author Brix Team
 * @since 3.0.0
 */
@SpringBootApplication
public class ShellApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShellApplication.class, args);
    }
}
