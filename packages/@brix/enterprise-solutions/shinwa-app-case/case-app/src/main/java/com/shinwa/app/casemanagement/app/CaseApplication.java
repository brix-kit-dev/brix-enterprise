package com.shinwa.app.casemanagement.app;

import io.runtime.sdk.context.RuntimeContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

/**
 * Case Module Application Entry Point
 * 
 * <p><b>v3.0 Architecture Notes:</b></p>
 * <p>As the entry point for a v3.0 App module, this class is responsible for:</p>
 * <ul>
 *   <li>Initializing the Spring Boot application context</li>
 *   <li>Obtaining runtime capabilities from RuntimeContext</li>
 *   <li>Registering module metadata with the runtime</li>
 * </ul>
 * 
 * <p><b>Capability Contract:</b></p>
 * <p>This application declaratively obtains required capabilities via RuntimeContext:</p>
 * <ul>
 *   <li>HttpCapability - HTTP client capability</li>
 *   <li>MessagingCapability - Message queue capability</li>
 *   <li>CacheCapability - Caching capability</li>
 *   <li>StorageCapability - Storage capability</li>
 * </ul>
 * 
 * @author Shinwa Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-23
 * @see RuntimeContext
 */
@SpringBootApplication(scanBasePackages = {
    "com.shinwa.app.casemanagement",
    "com.shinwa.runtime",
    "com.shinwa.platform"
})
public class CaseApplication {

    private static final Logger log = LoggerFactory.getLogger(CaseApplication.class);

    /**
     * Application entry point.
     * 
     * @param args command line arguments
     */
    public static void main(String[] args) {
        // Print startup banner
        printBanner();

        // Start Spring Boot application
        ApplicationContext context = SpringApplication.run(CaseApplication.class, args);

        // Get RuntimeContext and print capability info
        RuntimeContext runtime = context.getBean(RuntimeContext.class);
        printCapabilities(runtime);

        log.info("========================================");
        log.info("Case Module started successfully");
        log.info("Module name: case");
        log.info("Version: 3.0.0-SNAPSHOT");
        log.info("========================================");
    }

    /**
     * Prints the startup banner.
     */
    private static void printBanner() {
        String banner = """
            
            +===============================================================+
            |                                                               |
            |  Case Module                                                  |
            |                                                               |
            |  Powered by Shinwa Platform v3.0                              |
            |  Runtime Shell Architecture                                   |
            |                                                               |
            +===============================================================+
            """;
        System.out.println(banner);
    }

    /**
     * Prints runtime capability information.
     * 
     * @param runtime RuntimeContext instance
     */
    private static void printCapabilities(RuntimeContext runtime) {
        log.info("Runtime capabilities injected:");
        log.info("  - EventBus capability: {}", runtime.getEventBus() != null ? "Ready" : "Not configured");
        log.info("  - StateStore capability: {}", runtime.getStateStore() != null ? "Ready" : "Not configured");
        log.info("  - AuthContext capability: {}", runtime.getAuthContext() != null ? "Ready" : "Not configured");
        log.info("  - Observability capability: {}", runtime.getObservability() != null ? "Ready" : "Not configured");
    }
}
