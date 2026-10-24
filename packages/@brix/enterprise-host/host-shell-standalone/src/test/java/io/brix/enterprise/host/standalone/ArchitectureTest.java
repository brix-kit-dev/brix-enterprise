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
package io.brix.enterprise.host.standalone;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import com.tngtech.archunit.lang.ArchRule;
import io.brix.architecture.guard.BrixArchitectureRules;
import org.junit.jupiter.api.Test;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;

import static org.junit.jupiter.api.Assertions.assertTrue;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Architecture red-line guard tests for the Host ultra-thin shell layer.
 *
 * <p>Uses the {@link BrixArchitectureRules#hostProfile()} rule set to ensure the Host layer
 * adheres to the following principles:</p>
 * <ul>
 *   <li>Host layer should only consist of pom.xml + YAML config + startup class</li>
 *   <li>AutoConfiguration classes must not contain @Bean methods (except middleware assembly)</li>
 *   <li>No business logic or control flow code is permitted</li>
 *   <li>No private methods (indicating implementation details)</li>
 * </ul>
 *
 * <p>If this test fails, the code violates architecture red lines and must be corrected
 * before submission.</p>
 *
 * @see BrixArchitectureRules#hostProfile()
 * @see <a href="docs/v3.0.10-运行壳架构设计蓝图.md">v3.0.10 Runtime Shell Architecture Blueprint</a>
 */
@AnalyzeClasses(packages = "io.brix.enterprise.host.standalone")
public class ArchitectureTest {

    /**
     * Host-layer-specific architecture rule set.
     *
     * <p>Unlike the {@code pluginProfile()} used by business modules, the Host uses
     * {@code hostProfile()}, which applies constraints specific to the Host ultra-thin shell.</p>
     */
    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.hostProfile();

    /**
     * Host source must not import commercial plugin business implementation types.
     */
    @ArchTest
    static final ArchRule hostDoesNotDependOnEnterpriseBusinessTypes = noClasses()
        .that().resideInAPackage("io.brix.enterprise.host..")
        .should().dependOnClassesThat().resideInAPackage("io.brix.enterprise.app..")
        .because("Host may assemble plugin artifacts in the POM but source code must only call Runtime Bootstrap API");

    @Test
    void hostSourceDoesNotDependOnEnterpriseBusinessTypes() {
        hostDoesNotDependOnEnterpriseBusinessTypes.check(new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .importPackages("io.brix.enterprise.host.standalone"));
    }

    @Test
    void hostMapsFirstOwnerSetupBaseUrlToIdentityCapability() throws IOException {
        String applicationYaml = resourceText("application.yml");

        assertTrue(applicationYaml.contains("first-owner-invitee-setup:"));
        assertTrue(applicationYaml.contains(
            "setup-base-url: ${BRIX_TENANT_FIRST_OWNER_SETUP_BASE_URL:${BRIX_IDENTITY_PROVIDER_ISSUER:}/auth/setup}"));
    }

    private static String resourceText(String name) throws IOException {
        try (InputStream input = ArchitectureTest.class.getClassLoader().getResourceAsStream(name)) {
            if (input == null) {
                throw new IOException(name + " was not found on the test classpath");
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
