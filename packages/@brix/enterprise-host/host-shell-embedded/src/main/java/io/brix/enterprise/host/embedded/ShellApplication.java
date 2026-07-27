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
package io.brix.enterprise.host.embedded;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrap;

/**
 * Brix Enterprise embedded mode shell entry point.
 *
 * <p>This is the unified entry point for embedded mode (Embedded Mode),
 * assembling the following components:</p>
 * <ul>
 *   <li><b>Lightweight Runtime Capabilities</b> - Webhook EventBus, In-Memory StateStore</li>
 *   <li><b>Business Modules</b> - On-demand loaded plugin combinations</li>
 * </ul>
 *
 * <h2>Discovery Strategy</h2>
 * <p>The shell does not declare package scans. Runtime capabilities and plugin
 * server modules are assembled through Maven dependencies, Spring Boot
 * auto-configuration imports, plugin manifests, and YAML configuration.</p>
 *
 * <h2>Runtime Bootstrap</h2>
 * <p>After Spring has assembled the Host classpath, this entry point delegates
 * plugin discovery, lifecycle start, and readiness aggregation to the v3.0.10
 * Runtime Shell bootstrap API. The Host does not import plugin implementation
 * classes or lifecycle internals.</p>
 *
 * <h2>Use Cases</h2>
 * <ul>
 *   <li>Embedding into customer systems</li>
 *   <li>Local development and testing</li>
 *   <li>Environments without Kafka/Redis dependencies</li>
 *   <li>Standalone or combined plugin sales</li>
 * </ul>
 *
 * <h2>Startup Commands</h2>
 * <pre>
 * java -jar host-shell-embedded.jar --spring.profiles.active=embedded
 * </pre>
 *
 * @author Brix Team
 * @since 3.0.0
 */
@SpringBootApplication
public class ShellApplication {

    public static void main(String[] args) {
        RuntimeShellBootstrap.start(SpringApplication.run(ShellApplication.class, args));
    }
}
