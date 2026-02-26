/*
 * Copyright 2026 Shinwa Platform Team.
 * All rights reserved.
 */
package com.shinwa.app.intake;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Spring Boot Application Entry Point for the Intake Module.
 * <p>
 * This is the bootstrap class for the medical document intake application.
 * It initializes all Spring components and starts the embedded web server.
 * </p>
 *
 * <p><b>Module Responsibilities:</b></p>
 * <ul>
 *   <li>Medical document checklist management</li>
 *   <li>Customer document submission tracking</li>
 *   <li>Document review workflow</li>
 *   <li>Case integration via events</li>
 * </ul>
 *
 * <p><b>Architecture:</b></p>
 * <p>
 *   This module follows the v3.0.4 Runtime Shell Architecture Blueprint,
 *   with clear separation between API, Core, and Server layers.
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@SpringBootApplication(scanBasePackages = "com.shinwa.app.intake")
@EntityScan("com.shinwa.app.intake.core.domain")
@EnableJpaRepositories("com.shinwa.app.intake.core.repository")
@EnableJpaAuditing
@Slf4j
public class IntakeApplication {

    /**
     * Main entry point for the application.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(IntakeApplication.class, args);
        logStartupInfo(context);
    }

    /**
     * Logs startup information for diagnostic purposes.
     *
     * @param context the application context
     */
    private static void logStartupInfo(ConfigurableApplicationContext context) {
        Environment env = context.getEnvironment();
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }

        String serverPort = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        String hostAddress = "localhost";

        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("Unable to determine host address: {}", e.getMessage());
        }

        log.info("""
            
            ----------------------------------------------------------
            Application '{}' is running! Access URLs:
            Local:      {}://localhost:{}{}
            External:   {}://{}:{}{}
            Profile(s): {}
            ----------------------------------------------------------""",
            env.getProperty("spring.application.name", "intake-app"),
            protocol, serverPort, contextPath,
            protocol, hostAddress, serverPort, contextPath,
            String.join(", ", env.getActiveProfiles())
        );
    }
}
