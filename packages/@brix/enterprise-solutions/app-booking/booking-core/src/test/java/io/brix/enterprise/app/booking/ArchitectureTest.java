/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * 架构约束测试 — 接入 Brix Architecture Guard 共享规则库
 * 替代原有的 ArchitectureConstraintTest + LayerDependencyTest，
 * 统一使用 pluginProfile() 覆盖全部 8 条架构红线。
 *
 * @author Brix Architecture Team
 * @since 3.1.0
 */
package io.brix.enterprise.app.booking;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;
import io.brix.architecture.guard.BrixArchitectureRules;

/**
 * Booking 模块架构约束测试
 *
 * <p>自动启用全部 8 条架构红线守护。
 * 任何违反红线的代码提交都将导致 {@code mvn test} 失败。</p>
 */
@AnalyzeClasses(packages = "io.brix.enterprise.app.booking")
class ArchitectureTest {

    @ArchTest
    static final ArchTests rules = BrixArchitectureRules.coreProfileV2();
}
