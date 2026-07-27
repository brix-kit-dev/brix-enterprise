/*
 * Copyright 2026 Brix Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.brix.enterprise.host.standalone.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrap;

/**
 * Standalone mode Runtime Shell auto-configuration.
 *
 * <h2>Architecture Position (v3.0.10 Runtime Shell)</h2>
 * <p>
 * This class follows the <b>Host Ultra-Thin</b> principle and is solely responsible for:
 * </p>
 * <ul>
 *   <li>Declaring configuration property class ({@link StandaloneShellProperties})</li>
 * </ul>
 *
 * <p>
 * Runtime bootstrap, plugin discovery, capability validation, lifecycle
 * orchestration, and readiness aggregation are provided by runtime-orchestrator
 * auto-configuration. No explicit {@code @Import} is needed. The Host layer
 * contains no business code.
 * </p>
 *
 * <h2>Blueprint Red-Line Verification</h2>
 * <ul>
 *   <li>Red Line 3 (Host Ultra-Thin): Class line count &lt; 50 lines ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No @Bean definitions ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No if/else/for/try-catch control flow ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No private methods ✓</li>
 *   <li>Host source imports only Runtime Shell bootstrap API, never plugin business types</li>
 * </ul>
 *
 * <h2>Configuration Example</h2>
 * <pre>{@code
 * brix:
 *   shell:
 *     standalone:
 *       enabled: true
 *       module-id: brix-platform
 *   capability:
 *     auto-discovery: true
 *     validate-on-startup: true
 *     required:
 *       - io.runtime.sdk.capability.EventBusCapability
 * }</pre>
 *
 * @author Host Assembly Team
 * @since 3.0.0
 * @see StandaloneShellProperties
 */
@AutoConfiguration
@ConditionalOnClass(RuntimeShellBootstrap.class)
@ConditionalOnProperty(prefix = "brix.shell.standalone", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(StandaloneShellProperties.class)
public class StandaloneShellAutoConfiguration {
    // EMPTY — ultra-thin Host
    // RuntimeShellBootstrapAutoConfiguration is discovered from runtime-orchestrator.
}
