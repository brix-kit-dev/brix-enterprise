/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.runtime.sdk.capability.AuthCapability;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.capability.NotificationCapability;
import io.runtime.sdk.plugin.PluginContext;
import io.runtime.sdk.plugin.PluginIdentity;

/**
 * Verifies tenant plugin startup uses only manifest-declared capabilities.
 *
 * @author Brix Platform Team
 * @since 3.0.10
 */
class TenantPluginRequiredCapabilityTest {

    @Test
    void startupFailsWhenARequiredCapabilityIsMissing() {
        TenantPlugin plugin = new TenantPlugin();

        assertThatThrownBy(() -> plugin.onStart(new MissingEventBusPluginContext()))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining(EventBusCapability.class.getSimpleName());

        assertThat(plugin.health().status()).isEqualTo(io.runtime.sdk.plugin.BrixHealth.Status.DOWN);
    }

    @Test
    void startupIsDegradedWhenOnlyOptionalNotificationIsMissing() {
        TenantPlugin plugin = new TenantPlugin();

        plugin.onStart(new RequiredCapabilitiesOnlyPluginContext());

        assertThat(plugin.health().status()).isEqualTo(io.runtime.sdk.plugin.BrixHealth.Status.DEGRADED);
    }

    private static class RequiredCapabilitiesOnlyPluginContext implements PluginContext {

        @Override
        public <C> C require(Class<C> capabilityType) {
            if (capabilityType == AuthCapability.class || capabilityType == EventBusCapability.class) {
                return capabilityType.cast(java.lang.reflect.Proxy.newProxyInstance(
                    capabilityType.getClassLoader(),
                    new Class<?>[] { capabilityType },
                    (proxy, method, args) -> defaultValue(method.getReturnType())));
            }
            throw new IllegalStateException("Missing required capability " + capabilityType.getSimpleName());
        }

        @Override
        public <C> Optional<C> find(Class<C> capabilityType) {
            if (capabilityType == NotificationCapability.class) {
                return Optional.empty();
            }
            throw new IllegalStateException("Undeclared optional capability " + capabilityType.getSimpleName());
        }

        @Override
        public PluginIdentity pluginIdentity() {
            return new PluginIdentity("brix-app-tenant");
        }
    }

    private static final class MissingEventBusPluginContext extends RequiredCapabilitiesOnlyPluginContext {

        @Override
        public <C> C require(Class<C> capabilityType) {
            if (capabilityType == EventBusCapability.class) {
                throw new IllegalStateException("Missing required capability "
                    + capabilityType.getSimpleName());
            }
            return super.require(capabilityType);
        }
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType == boolean.class) {
            return false;
        }
        if (returnType == int.class || returnType == long.class || returnType == short.class
            || returnType == byte.class) {
            return 0;
        }
        if (returnType == float.class || returnType == double.class) {
            return 0.0;
        }
        if (returnType == char.class) {
            return '\0';
        }
        return null;
    }
}
