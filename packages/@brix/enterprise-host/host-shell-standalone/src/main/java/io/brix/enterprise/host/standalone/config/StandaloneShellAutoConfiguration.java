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

import io.runtime.sdk.context.RuntimeContext;

/**
 * Standalone mode Runtime Shell auto-configuration.
 *
 * <h2>Architecture Position (v3.0.4 Host Ultra-Thin Refactoring)</h2>
 * <p>
 * This class follows the <b>Host Ultra-Thin</b> principle and is solely responsible for:
 * </p>
 * <ul>
 *   <li>Declaring configuration property class ({@link StandaloneShellProperties})</li>
 * </ul>
 *
 * <p>
 * All capability scanning, registration, and validation logic has been extracted to
 * {@code CapabilityAutoConfiguration} which is discovered automatically via
 * {@code META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}
 * in the runtime-orchestrator module. No explicit {@code @Import} is needed.
 * The Host layer contains no business code.
 * </p>
 *
 * <h2>Blueprint Red-Line Verification</h2>
 * <ul>
 *   <li>Red Line 3 (Host Ultra-Thin): Class line count &lt; 50 lines ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No @Bean definitions ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No if/else/for/try-catch control flow ✓</li>
 *   <li>Red Line 3 (Host Ultra-Thin): No private methods ✓</li>
 *   <li>Red Line R6.9: No @Import — AutoConfiguration discovery via imports file ✓</li>
 * </ul>
 *
 * <h2>Package Rename (v3.0.9)</h2>
 * <p>Renamed from {@code io.host.shell.standalone.config} to
 * {@code io.brix.enterprise.host.standalone.config}.</p>
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
@ConditionalOnClass(RuntimeContext.class)
@ConditionalOnProperty(prefix = "brix.shell.standalone", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(StandaloneShellProperties.class)
public class StandaloneShellAutoConfiguration {
    // EMPTY — ultra-thin Host
    // CapabilityAutoConfiguration is discovered via META-INF/spring/AutoConfiguration.imports
    // in runtime-orchestrator (R6.9: no @Import needed)
}
