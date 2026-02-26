/*
 * Copyright 2026 Brix Authors. Licensed under Apache-2.0.
 */
package io.host.shell.embedded;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * 嵌入式主机壳架构约束测试。
 *
 * <p>使用 HostProfile 验证主机层架构红线（宽松约束）。</p>
 *
 * <p>主机层允许直接使用 Spring 容器API和基础设施适配器，
 * 但仍需遵守HTTP客户端和事件发布约束。</p>
 */
@AnalyzeClasses(
    packages = "io.host.shell.embedded",
    importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    @ArchTest
    static final ArchTests hostRules = BrixArchitectureRules.hostProfile();
}
