/*
 * Copyright 2026 Brix Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.brix.host.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.security.Principal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrap;
import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrapHandle;
import io.runtime.orchestrator.capability.DefaultCapabilityRegistry;
import io.runtime.orchestrator.endpoint.DefaultPluginEndpointDispatcher;
import io.runtime.orchestrator.plugin.ClasspathPluginRuntimeDescriptorResolver;
import io.runtime.orchestrator.plugin.PluginRuntimeException;
import io.runtime.orchestrator.plugin.PluginRuntimeManager;
import io.runtime.orchestrator.plugin.PluginRuntimeState;
import io.runtime.orchestrator.plugin.ServiceLoaderPluginDiscovery;
import io.runtime.sdk.capability.AuthCapability;
import io.runtime.sdk.capability.DataScope;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.plugin.BrixHealth;
import io.runtime.sdk.plugin.PluginLifecycleState;

/**
 * Contract tests for v3.0.10 Host to Runtime Shell bootstrap integration.
 *
 * <p>The test module assembles the tenant plugin artifact as a test dependency,
 * then verifies discovery and readiness through Runtime Shell APIs only. Test
 * source does not import tenant plugin implementation, controller, service,
 * entity, repository, or mapper types.</p>
 *
 * @author Brix Architecture Team
 * @since 3.0.10
 */
class RuntimeShellBootstrapContractTest {

    private static final String TENANT_PLUGIN_ID = "brix-app-tenant";

    @Test
    void tenantOnlyRuntimeBootstrapDiscoversAndStartsRequiredTenantProvider() {
        DefaultPluginEndpointDispatcher dispatcher = new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30));
        RuntimeShellBootstrap bootstrap = new RuntimeShellBootstrap(runtimeManager(
            registryWithTenantRequiredCapabilities(),
            List.of(TENANT_PLUGIN_ID),
            dispatcher));

        RuntimeShellBootstrapHandle handle = bootstrap.start();
        List<PluginRuntimeState> states = bootstrap.pluginStates();

        assertThat(bootstrap.ready()).isTrue();
        assertThat(handle.ready()).isTrue();
        assertThat(states)
            .anySatisfy(state -> {
                assertThat(state.identity().pluginId()).isEqualTo(TENANT_PLUGIN_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
                assertThat(state.health().status()).isIn(BrixHealth.Status.UP, BrixHealth.Status.DEGRADED);
            });
        assertThat(dispatcher.invoke("GET", "/api/v1/tenants", null, Map.of(), permissionHeaders()))
            .extracting(RuntimeShellBootstrapContractTest::responseStatus)
            .isEqualTo(200);
        Object created = dispatcher.invoke("POST", "/api/v1/tenants", Map.of(
            "code", "acme-corp",
            "name", "Acme Corporation",
            "ownerIdentityId", 1001L,
            "contactEmail", "owner@example.com"), Map.of(), permissionHeaders());
        assertThat(responseStatus(created)).isEqualTo(201);
        assertThat(responseBody(created))
            .extracting(RuntimeShellBootstrapContractTest::tenantCode)
            .isEqualTo("acme-corp");
        assertThat(dispatcher.invoke("GET", "/api/v1/tenants/7", null, Map.of(), permissionHeaders()))
            .extracting(RuntimeShellBootstrapContractTest::responseBody)
            .extracting(RuntimeShellBootstrapContractTest::tenantId)
            .isEqualTo(7L);
        bootstrap.stop();
    }

    @Test
    void requiredTenantProviderMissingFromCompositionFailsFast() {
        RuntimeShellBootstrap bootstrap = new RuntimeShellBootstrap(runtimeManager(
            registryWithTenantRequiredCapabilities(),
            List.of("missing-required-plugin"),
            new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30))));

        assertThatThrownBy(bootstrap::start)
            .isInstanceOf(PluginRuntimeException.class)
            .hasMessageContaining("Required BrixPlugin provider(s) missing");
        assertThat(bootstrap.ready()).isFalse();
    }

    private static PluginRuntimeManager runtimeManager(
            DefaultCapabilityRegistry registry,
            List<String> requiredPlugins,
            DefaultPluginEndpointDispatcher dispatcher) {
        return new PluginRuntimeManager(
            new ServiceLoaderPluginDiscovery()::discover,
            new ClasspathPluginRuntimeDescriptorResolver(),
            registry,
            requiredPlugins,
            dispatcher,
            RuntimeShellBootstrapContractTest::initializeTenantEndpointServices);
    }

    private static DefaultCapabilityRegistry registryWithTenantRequiredCapabilities() {
        DefaultCapabilityRegistry registry = new DefaultCapabilityRegistry();
        registry.register(AuthCapability.class, new ContractAuthCapability());
        registry.register(EventBusCapability.class, EventBusTestFactory.allImplementations()
            .findFirst()
            .orElseThrow());
        return registry;
    }

    private static Map<String, List<String>> permissionHeaders() {
        return Map.of(
            "x-actor-id", List.of("runtime-shell-contract"),
            "x-tenant-id", List.of("system"));
    }

    private static Object responseBody(Object response) {
        return invokeNoArg(response, "body");
    }

    private static Object responseStatus(Object response) {
        return invokeNoArg(response, "status");
    }

    private static Object tenantId(Object tenant) {
        return invokeNoArg(tenant, "getId");
    }

    private static Object tenantCode(Object tenant) {
        return invokeNoArg(tenant, "getCode");
    }

    private static Object invokeNoArg(Object target, String methodName) {
        try {
            return target.getClass().getMethod(methodName).invoke(target);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Unable to invoke " + methodName + " on " + target.getClass().getName(), e);
        }
    }

    private static void initializeTenantEndpointServices(io.runtime.sdk.plugin.BrixPlugin plugin) {
        if (!"io.brix.enterprise.app.tenant.TenantPlugin".equals(plugin.getClass().getName())) {
            return;
        }
        try {
            Class<?> serviceType = Class.forName("io.brix.enterprise.app.tenant.service.TenantManagementService");
            Method setter = plugin.getClass().getMethod("setTenantServices", serviceType, ObjectMapper.class);
            Object service = Proxy.newProxyInstance(
                RuntimeShellBootstrapContractTest.class.getClassLoader(),
                new Class<?>[] {serviceType},
                new ContractTenantServiceHandler());
            setter.invoke(plugin, service, new ObjectMapper());
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Unable to initialize tenant endpoint contract service", e);
        }
    }

    private static final class ContractTenantServiceHandler implements InvocationHandler {

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws ReflectiveOperationException {
            return switch (method.getName()) {
                case "createTenant" -> tenant(
                    7L,
                    text(args[0], "getCode"),
                    text(args[0], "getName"),
                    text(args[0], "getContactEmail"));
                case "getTenantById" -> tenant((Long) args[0], "acme-corp", "Acme Corporation", "owner@example.com");
                case "getTenantByCode" -> tenant(7L, (String) args[0], "Acme Corporation", "owner@example.com");
                case "listTenants" -> List.of(tenant(7L, "acme-corp", "Acme Corporation", "owner@example.com"));
                case "activateTenant", "suspendTenant" -> tenant(
                    (Long) args[0],
                    "acme-corp",
                    "Acme Corporation",
                    "owner@example.com");
                case "listMembers" -> List.of();
                default -> throw new UnsupportedOperationException("Unsupported tenant contract method: "
                    + method.getName());
            };
        }

        private static String text(Object target, String methodName) throws ReflectiveOperationException {
            Object value = target.getClass().getMethod(methodName).invoke(target);
            return value == null ? null : value.toString();
        }

        private static Object tenant(Long id, String code, String name, String contactEmail)
                throws ReflectiveOperationException {
            Class<?> dtoType = Class.forName("io.brix.enterprise.app.tenant.dto.TenantDTO");
            return dtoType.getConstructor(
                Long.class,
                String.class,
                String.class,
                String.class,
                String.class,
                OffsetDateTime.class,
                OffsetDateTime.class)
                .newInstance(id, code, name, "ACTIVE", contactEmail, OffsetDateTime.now(), OffsetDateTime.now());
        }
    }

    private static final class ContractAuthCapability implements AuthCapability {

        @Override
        public Principal getCurrentPrincipal() {
            return () -> "runtime-shell-contract";
        }

        @Override
        public boolean hasPermission(String permission) {
            return permission != null && !permission.isBlank();
        }

        @Override
        public boolean hasRole(String role) {
            return role != null && !role.isBlank();
        }

        @Override
        public Set<DataScope> getAuthorizedScopes() {
            return Set.of(DataScope.all());
        }
    }
}
