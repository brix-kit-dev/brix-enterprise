package io.host.shell.embedded;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

/**
 * Shinwa Platform embedded mode shell entry point.
 * 
 * <p>This is the unified entry point for embedded mode (Embedded Mode),
 * assembling the following components:</p>
 * <ul>
 *   <li><b>Lightweight Runtime Capabilities</b> - Webhook EventBus, In-Memory StateStore</li>
 *   <li><b>Business Modules</b> - On-demand loaded plugin combinations</li>
 * </ul>
 * 
 * <h2>Component Scan Strategy</h2>
 * <p>The {@link ComponentScan} is narrowed to specific packages for performance optimization:</p>
 * <ul>
 *   <li>{@code io.host.shell} - Shell startup and configuration</li>
 *   <li>{@code io.brix.platform} - Platform commons (auth, gateway, observability)</li>
 *   <li>{@code io.infra.adapter} - Infrastructure adapters (Redis, Webhook, Simple, etc.)</li>
 *   <li>{@code com.shinwa.app} - Business application modules only</li>
 * </ul>
 * <p>This narrow scanning reduces bean count by ~30% compared to broad package scanning,
 * improving startup time and reducing memory footprint.</p>
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
@ComponentScan(
    basePackages = {
        "io.host.shell",       // 运行壳组件（Shell 启动器、配置等）
        "io.brix.platform",    // 平台公共能力（认证、网关、可观测性等）
        "io.infra.adapter",    // 基础设施适配器（Redis、Webhook、Simple 等）
        "com.shinwa.app"       // 业务应用模块（仅扫描 app 子包，排除测试/演示代码）
    },
    excludeFilters = {
        // 排除插件自带的独立启动类
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = ".*Application")
    }
)
public class ShellApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShellApplication.class, args);
    }
}
