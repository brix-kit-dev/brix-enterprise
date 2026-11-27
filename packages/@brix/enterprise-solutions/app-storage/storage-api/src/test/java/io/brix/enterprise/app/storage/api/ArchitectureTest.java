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
package io.brix.enterprise.app.storage.api;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.junit.ArchTests;

import io.brix.architecture.guard.BrixArchitectureRules;
import io.brix.architecture.guard.ModuleClasses;

/**
 * app-storage's api module runs the guard's plugin profile on its own classes, by its moduleKind, as its core
 * and server modules do (root BRX-RS-MANIFEST-009; standard-link plan queue item 22, 22g, D180).
 */
@AnalyzeClasses(locations = ModuleClasses.class)
class ArchitectureTest {

    @ArchTest
    static final ArchTests pluginRules = BrixArchitectureRules.pluginProfile();
}
