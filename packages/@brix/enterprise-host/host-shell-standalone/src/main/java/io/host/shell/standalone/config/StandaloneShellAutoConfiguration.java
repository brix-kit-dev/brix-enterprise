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
package io.host.shell.standalone.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;

import io.runtime.orchestrator.autoconfigure.CapabilityAutoConfiguration;
import io.runtime.sdk.context.RuntimeContext;

/**
 * 产品模式运行壳自动配置
 *
 * <h2>架构定位（v3.0.4 Host 极薄化改造）</h2>
 * <p>
 * 本类遵循 <b>Host 极薄化</b> 原则，仅负责：
 * </p>
 * <ul>
 *   <li>声明配置属性类（{@link StandaloneShellProperties}）</li>
 *   <li>导入能力自动配置（{@link CapabilityAutoConfiguration}）</li>
 * </ul>
 *
 * <p>
 * 所有能力扫描、注册、验证逻辑已提取到 {@link CapabilityAutoConfiguration}，
 * Host 层不再包含任何业务代码。
 * </p>
 *
 * <h2>蓝图红线验证</h2>
 * <ul>
 *   <li>红线 3（Host 极薄）：本类代码行数 &lt; 50 行 ✓</li>
 *   <li>红线 3（Host 极薄）：无 @Bean 定义 ✓</li>
 *   <li>红线 3（Host 极薄）：无 if/else/for/try-catch 控制流 ✓</li>
 *   <li>红线 3（Host 极薄）：无 private 方法 ✓</li>
 * </ul>
 *
 * <h2>配置示例</h2>
 * <pre>{@code
 * brix:
 *   shell:
 *     standalone:
 *       enabled: true
 *       module-id: shinwa-platform
 *   capability:
 *     auto-discovery: true
 *     validate-on-startup: true
 *     required:
 *       - io.runtime.sdk.capability.EventBusCapability
 * }</pre>
 *
 * @author Host Assembly Team
 * @since 3.0.0
 * @see CapabilityAutoConfiguration
 * @see StandaloneShellProperties
 */
@AutoConfiguration
@ConditionalOnClass(RuntimeContext.class)
@ConditionalOnProperty(prefix = "brix.shell.standalone", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(StandaloneShellProperties.class)
@Import(CapabilityAutoConfiguration.class)
public class StandaloneShellAutoConfiguration {
    // EMPTY — ultra-thin Host
    // 所有能力扫描/注册/验证逻辑已提取到 CapabilityAutoConfiguration
}
