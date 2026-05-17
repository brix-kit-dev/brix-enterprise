/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.config;

import io.brix.enterprise.app.identity.entity.User;
import io.brix.enterprise.app.identity.enums.UserRole;
import io.brix.enterprise.app.identity.enums.UserStatus;
import io.brix.enterprise.app.identity.repository.UserRepository;
import io.brix.enterprise.app.identity.service.PasswordHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Development environment data initializer for the Identity module.
 *
 * <p>This configuration class creates a default admin user during application startup,
 * exclusively for development and testing purposes. It is protected by the {@code @Profile("dev")}
 * annotation to ensure it never runs in production environments.</p>
 *
 * <h3>Security Considerations</h3>
 * <ul>
 *   <li>This initializer is only active when the "dev" profile is enabled</li>
 *   <li>Passwords are never logged in plaintext for security compliance</li>
 *   <li>The default password should be changed immediately in any non-local environment</li>
 * </ul>
 *
 * <h3>Architecture Alignment</h3>
 * <p>This class resides in the {@code identity-server} module as per the v3.0.6 Runtime Shell
 * architecture. Data initialization logic belongs in the server layer, not the core layer,
 * ensuring proper separation of concerns between domain logic and infrastructure concerns.</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see io.brix.enterprise.app.identity.service.PasswordHasher
 */
@Configuration
@Profile("dev")
public class IdentityDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(IdentityDataInitializer.class);

    /**
     * Default admin username for development environment.
     */
    private static final String DEFAULT_ADMIN_USERNAME = "admin";

    /**
     * Default tenant ID for single-tenant development setup.
     */
    private static final String DEFAULT_TENANT_ID = "default";

    /**
     * Default admin user code following the platform's ID generation convention.
     */
    private static final String DEFAULT_ADMIN_USER_CODE = "U00000001";

    /**
     * Creates a {@link CommandLineRunner} bean that initializes the default admin user.
     *
     * <p>This method performs an idempotent check before creating the admin user,
     * ensuring no duplicate users are created on subsequent startups. The admin user
     * is created with the following characteristics:</p>
     * <ul>
     *   <li>Role: ADMIN (full system access)</li>
     *   <li>Status: ACTIVE (immediately usable)</li>
     *   <li>Password: Hashed using the platform's standard {@link PasswordHasher}</li>
     * </ul>
     *
     * <p><strong>Important:</strong> The default password is intentionally not logged
     * to prevent credential exposure in log aggregation systems. Refer to the project's
     * development documentation for default credentials.</p>
     *
     * @param userRepository the repository for persisting user entities
     * @param passwordHasher the platform's password hashing service
     * @return a CommandLineRunner that executes the initialization logic
     */
    @Bean
    public CommandLineRunner initDevAdminUser(UserRepository userRepository, PasswordHasher passwordHasher) {
        return args -> {
            log.warn("[Identity] Dev-only initializer is using tenant '{}'; this bean is protected by @Profile(\"dev\")", DEFAULT_TENANT_ID);

            // Idempotent check: skip if admin user already exists
            if (userRepository.existsByUsernameAndTenantId(DEFAULT_ADMIN_USERNAME, DEFAULT_TENANT_ID)) {
                log.info("[Identity] Dev admin user already exists, skipping initialization");
                return;
            }

            // Create the admin user with proper entity initialization
            User admin = new User(DEFAULT_TENANT_ID, DEFAULT_ADMIN_USER_CODE, DEFAULT_ADMIN_USERNAME);
            admin.setPasswordHash(passwordHasher.hash("admin123"));
            admin.setEmail("admin@brix.io");
            admin.setDisplayName("System Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);

            userRepository.save(admin);

            // Log creation without exposing sensitive credentials
            // Security Note: Password is intentionally omitted from logs to prevent
            // credential leakage in centralized logging systems (ELK, Splunk, etc.)
            log.info("============================================================");
            log.info("  [Identity] Dev admin user created successfully!");
            log.info("  Username: {}", DEFAULT_ADMIN_USERNAME);
            log.info("  Tenant:   {}", DEFAULT_TENANT_ID);
            log.info("  Profile:  dev (this initializer only runs in dev profile)");
            log.info("============================================================");
            log.debug("[Identity] Dev admin password is configured in application-dev.yml or use default");
        };
    }
}
