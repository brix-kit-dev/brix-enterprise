/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ServiceLoader;

import org.junit.jupiter.api.Test;

import io.runtime.sdk.plugin.BrixPlugin;

/**
 * Verifies that tenant-server publishes exactly one v3.0.10 plugin provider.
 *
 * @author Brix Platform Team
 * @since 3.0.10
 */
class TenantPluginServiceLoaderTest {

    @Test
    void serviceLoaderDiscoversExactlyOneTenantPluginProvider() {
        var providers = ServiceLoader.load(BrixPlugin.class).stream()
            .map(ServiceLoader.Provider::get)
            .filter(TenantPlugin.class::isInstance)
            .toList();

        assertThat(providers)
            .hasSize(1)
            .first()
            .isInstanceOf(TenantPlugin.class);
    }
}
