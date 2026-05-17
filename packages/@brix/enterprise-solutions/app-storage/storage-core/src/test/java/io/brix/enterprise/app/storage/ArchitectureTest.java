/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * 架构约束测试 — 接入 Brix Architecture Guard 共享规则库
 *
 * @author Brix Architecture Team
 * @since 3.1.0
 */
package io.brix.enterprise.app.storage;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Storage 模块架构约束测试
 *
 * <p>自动启用全部 8 条架构红线守护。</p>
 */
@AnalyzeClasses(packages = "io.brix.enterprise.app.storage")
class ArchitectureTest {

    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.coreProfileV2();
}
