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

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

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
 * <h3>Package Rename (v3.0.9)</h3>
 * <p>Package renamed from {@code io.host.shell.standalone} to
 * {@code io.brix.enterprise.host.standalone}.</p>
 *
 * @see BrixArchitectureRules#hostProfile()
 * @see <a href="docs/v3.0.9-运行壳架构设计蓝图.md">v3.0.9 Runtime Shell Architecture Blueprint</a>
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
}
