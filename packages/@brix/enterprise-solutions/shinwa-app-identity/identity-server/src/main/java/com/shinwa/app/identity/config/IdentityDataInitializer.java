/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.config;

import com.shinwa.app.identity.entity.User;
import com.shinwa.app.identity.enums.UserRole;
import com.shinwa.app.identity.enums.UserStatus;
import com.shinwa.app.identity.repository.UserRepository;
import com.shinwa.app.identity.service.PasswordHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 测试数据初始化
 * 
 * <p>在首次启动时自动创建管理员账号，用于开发和测试。</p>
 */
@Configuration
public class IdentityDataInitializer {
    
    private static final Logger log = LoggerFactory.getLogger(IdentityDataInitializer.class);
    
    @Bean
    public CommandLineRunner initTestUser(UserRepository userRepository, PasswordHasher passwordHasher) {
        return args -> {
            String tenantId = "default";
            String adminUsername = "admin";
            
            // 检查管理员是否已存在
            if (userRepository.existsByUsernameAndTenantId(adminUsername, tenantId)) {
                log.info("[Init] Admin user already exists, skipping creation");
                return;
            }
            
            // 创建管理员账号
            User admin = new User(tenantId, "U00000001", adminUsername);
            admin.setPasswordHash(passwordHasher.hash("admin123"));
            admin.setEmail("admin@shinwa.io");
            admin.setDisplayName("System Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            
            userRepository.save(admin);
            log.info("============================================================");
            log.info("  [Init] Default admin user created!");
            log.info("  Username: admin");
            log.info("  Password: admin123");
            log.info("  Tenant:   default");
            log.info("============================================================");
        };
    }
}
