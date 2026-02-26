package io.host.shell.standalone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

/**
 * Shinwa Platform standalone mode shell entry point.
 * 
 * <p>This is the unified entry point for standalone product mode (Standalone Mode),
 * assembling the following components:</p>
 * <ul>
 *   <li><b>Full Runtime Capabilities</b> - Kafka EventBus, Redis StateStore, OTel observability</li>
 *   <li><b>Business Modules</b> - shinwa-app-* series plugins</li>
 *   <li><b>Platform Services</b> - Authentication, Gateway, Config Center, etc.</li>
 * </ul>
 * 
 * <h2>Component Scan Strategy</h2>
 * <p>The {@link ComponentScan} is narrowed to specific packages for performance optimization:</p>
 * <ul>
 *   <li>{@code io.host.shell} - Shell startup and configuration</li>
 *   <li>{@code io.brix.platform} - Platform commons (auth, gateway, observability)</li>
 *   <li>{@code io.infra.adapter} - Infrastructure adapters (Redis, Kafka, Outbox)</li>
 *   <li>{@code com.shinwa.app} - Business application modules only</li>
 * </ul>
 * <p>This narrow scanning reduces bean count by ~30% compared to broad package scanning,
 * improving startup time and reducing memory footprint.</p>
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
@EntityScan(basePackages = {
    "com.shinwa.app",        // 业务模块实体
    "io.infra.adapter"       // 基础设施适配器实体（Outbox 等）
})
@ComponentScan(
    basePackages = {
        "io.host.shell",       // 运行壳组件（Shell 启动器、配置等）
        "io.brix.platform",    // 平台公共能力（认证、网关、可观测性等）
        "io.infra.adapter",    // 基础设施适配器（Redis、Kafka、Outbox 等）
        "com.shinwa.app"       // 业务应用模块（仅扫描 app 子包，排除测试/演示代码）
    },
    excludeFilters = {
        // 排除插件自带的独立启动类，产品模式由本类统一启动
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = ".*Application")
    }
)
public class ShellApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShellApplication.class, args);
    }
}
