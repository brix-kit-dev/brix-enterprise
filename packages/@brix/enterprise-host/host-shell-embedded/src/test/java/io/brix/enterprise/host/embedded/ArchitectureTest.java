/*
 * Copyright 2026 Brix Authors. Licensed under Apache-2.0.
 */
package io.brix.enterprise.host.embedded;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import com.tngtech.archunit.lang.ArchRule;
import io.brix.architecture.guard.BrixArchitectureRules;
import org.junit.jupiter.api.Test;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Architecture constraint tests for the embedded mode Host shell.
 *
 * <p>Uses the {@code hostProfile()} to verify Host-layer architecture red lines
 * (relaxed constraints compared to plugin profile).</p>
 *
 * <p>The Host layer may assemble Runtime, adapters, and selected plugin
 * artifacts through build metadata, but source code must only call Runtime
 * Bootstrap API and never import plugin business implementation types.</p>
 */
@AnalyzeClasses(
    packages = "io.brix.enterprise.host.embedded",
    importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    @ArchTest
    static final ArchTests hostRules = BrixArchitectureRules.hostProfile();

    @ArchTest
    static final ArchRule hostDoesNotDependOnEnterpriseBusinessTypes = noClasses()
        .that().resideInAPackage("io.brix.enterprise.host..")
        .should().dependOnClassesThat().resideInAPackage("io.brix.enterprise.app..")
        .because("Host may assemble plugin artifacts in the POM but source code must only call Runtime Bootstrap API");

    @Test
    void hostSourceDoesNotDependOnEnterpriseBusinessTypes() {
        hostDoesNotDependOnEnterpriseBusinessTypes.check(new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .importPackages("io.brix.enterprise.host.embedded"));
    }
}
