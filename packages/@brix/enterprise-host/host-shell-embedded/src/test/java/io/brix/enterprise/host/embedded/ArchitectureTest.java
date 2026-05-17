/*
 * Copyright 2026 Brix Authors. Licensed under Apache-2.0.
 */
package io.brix.enterprise.host.embedded;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Architecture constraint tests for the embedded mode Host shell.
 *
 * <p>Uses the {@code hostProfile()} to verify Host-layer architecture red lines
 * (relaxed constraints compared to plugin profile).</p>
 *
 * <p>The Host layer is allowed to use Spring container APIs and infrastructure adapters
 * directly, but must still comply with HTTP client and event publishing constraints.</p>
 *
 * <h3>Package Rename (v3.0.9)</h3>
 * <p>Package renamed from {@code io.host.shell.embedded} to
 * {@code io.brix.enterprise.host.embedded}.</p>
 */
@AnalyzeClasses(
    packages = "io.brix.enterprise.host.embedded",
    importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    @ArchTest
    static final ArchTests hostRules = BrixArchitectureRules.hostProfile();
}
