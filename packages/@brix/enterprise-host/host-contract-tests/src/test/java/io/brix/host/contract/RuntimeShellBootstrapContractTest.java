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
import java.lang.reflect.Proxy;
import java.security.Principal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;

import io.brix.platform.identity.internal.PlatformBootstrapAdministration;
import io.brix.platform.identity.internal.PlatformIdentityAdministration;
import io.brix.platform.tenant.internal.TenantAdministration;
import io.runtime.orchestrator.bootstrap.HostBootstrapCoordinator;
import io.runtime.orchestrator.bootstrap.HostRuntimeOperationalView;
import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrap;
import io.runtime.orchestrator.bootstrap.RuntimeShellBootstrapHandle;
import io.runtime.orchestrator.capability.DefaultCapabilityRegistry;
import io.runtime.orchestrator.endpoint.DefaultPluginEndpointDispatcher;
import io.runtime.orchestrator.endpoint.EndpointAccessDeniedException;
import io.runtime.orchestrator.internalcontract.InternalContractBinder;
import io.runtime.orchestrator.internalcontract.ServiceLoaderInternalContractProviderDiscovery;
import io.runtime.orchestrator.operational.OperationalModuleRuntimeManager;
import io.runtime.orchestrator.operational.OperationalRuntimeException;
import io.runtime.orchestrator.operational.ServiceLoaderOperationalModuleDiscovery;
import io.runtime.orchestrator.persistence.OwnerPersistenceProvider;
import io.runtime.orchestrator.plugin.ClasspathPluginRuntimeDescriptorResolver;
import io.runtime.orchestrator.plugin.PluginRuntimeException;
import io.runtime.orchestrator.plugin.PluginRuntimeManager;
import io.runtime.orchestrator.plugin.PluginRuntimeState;
import io.runtime.orchestrator.plugin.ServiceLoaderPluginDiscovery;
import io.runtime.sdk.capability.AuthCapability;
import io.runtime.sdk.capability.AuthFlowCapability;
import io.runtime.sdk.capability.DataScope;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.capability.PersistenceCapability;
import io.runtime.sdk.capability.UnitOfWork;
import io.runtime.sdk.internalcontract.InternalContractProvider;
import io.runtime.sdk.plugin.BrixHealth;
import io.runtime.sdk.plugin.BrixPlugin;
import io.runtime.sdk.plugin.PluginLifecycleState;

/**
 * Contract tests for v3.0.10 Host to Runtime Shell bootstrap integration.
 *
 * <p>The test module assembles platform-admin, platform-tenant, and app-booking
 * as test dependencies, then verifies discovery and readiness through Runtime
 * Shell APIs only. Test source does not import plugin implementation,
 * controller, service, entity, repository, or mapper types.</p>
 *
 * @author Brix Architecture Team
 * @since 3.0.10
 */
class RuntimeShellBootstrapContractTest {

    private static final String PLATFORM_ADMIN_MODULE_ID = "platform-admin";
    private static final String PLATFORM_AUTH_FLOW_MODULE_ID = "platform-auth-flow";
    private static final String PLATFORM_IDENTITY_PLUGIN_ID = "platform-identity";
    private static final String PLATFORM_TENANT_PLUGIN_ID = "platform-tenant";
    private static final String APP_BOOKING_PLUGIN_ID = "app-booking";
    private static final OwnerPersistenceProvider OWNER_PERSISTENCE = ownerId ->
        PLATFORM_IDENTITY_PLUGIN_ID.equals(ownerId)
            ? Optional.of(ContractOwnerPersistence.INSTANCE)
            : Optional.empty();

    @Test
    void phase1RuntimeHostBootstrapDiscoversAndStartsRequiredComposition() {
        DefaultPluginEndpointDispatcher dispatcher = new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30));
        RuntimeShellBootstrap bootstrap = hostBootstrap(
            dispatcher,
            List.of(PLATFORM_IDENTITY_PLUGIN_ID, PLATFORM_TENANT_PLUGIN_ID, APP_BOOKING_PLUGIN_ID),
            List.of(PLATFORM_AUTH_FLOW_MODULE_ID, PLATFORM_ADMIN_MODULE_ID),
            OWNER_PERSISTENCE);

        RuntimeShellBootstrapHandle handle = bootstrap.start();
        List<PluginRuntimeState> states = bootstrap.pluginStates();

        assertThat(bootstrap.ready()).isTrue();
        assertThat(handle.ready()).isTrue();
        assertThat(states)
            .anySatisfy(state -> {
                assertThat(state.identity().pluginId()).isEqualTo(PLATFORM_IDENTITY_PLUGIN_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
            })
            .anySatisfy(state -> {
                assertThat(state.identity().pluginId()).isEqualTo(PLATFORM_TENANT_PLUGIN_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
            })
            .anySatisfy(state -> {
                assertThat(state.identity().pluginId()).isEqualTo(APP_BOOKING_PLUGIN_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
                assertThat(state.health().status()).isEqualTo(BrixHealth.Status.UP);
            });
        assertThat(bootstrap.operationalStates())
            .anySatisfy(state -> {
                assertThat(state.identity().moduleId()).isEqualTo(PLATFORM_AUTH_FLOW_MODULE_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
                assertThat(state.entriesPublished()).isTrue();
            })
            .anySatisfy(state -> {
                assertThat(state.identity().moduleId()).isEqualTo(PLATFORM_ADMIN_MODULE_ID);
                assertThat(state.lifecycleState()).isEqualTo(PluginLifecycleState.STARTED);
                assertThat(state.ready()).isTrue();
                assertThat(state.entriesPublished()).isTrue();
            });
        assertThat(dispatcher.routes())
            .anySatisfy(route -> {
                assertThat(route.pluginId()).isEqualTo(PLATFORM_ADMIN_MODULE_ID);
                assertThat(route.path()).startsWith("/api/platform/");
            })
            .anySatisfy(route -> {
                assertThat(route.pluginId()).isEqualTo(APP_BOOKING_PLUGIN_ID);
                assertThat(route.endpointId()).isEqualTo("app-booking.template.status.v1");
                assertThat(route.path()).isEqualTo("/api/app-booking/v1/template/status");
            })
            .allSatisfy(route -> assertThat(route.pluginId()).isNotEqualTo("host-shell-standalone"));
        bootstrap.stop();
    }

    @Test
    void manifestGrantsAuthorizeTenantStaffAndRejectEndUsersBeforeHandlers() {
        DefaultPluginEndpointDispatcher dispatcher = new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30));
        RuntimeShellBootstrap bootstrap = hostBootstrap(
            dispatcher,
            List.of(PLATFORM_IDENTITY_PLUGIN_ID, PLATFORM_TENANT_PLUGIN_ID, APP_BOOKING_PLUGIN_ID),
            List.of(PLATFORM_AUTH_FLOW_MODULE_ID, PLATFORM_ADMIN_MODULE_ID),
            OWNER_PERSISTENCE);
        bootstrap.start();
        try {
            assertThat(invokeTemplateStatus(dispatcher, tenantCaller("actor", "MEMBER"))).isNotNull();

            assertThatThrownBy(() -> invokeTemplateStatus(dispatcher, tenantCaller("subject", "CUSTOMER")))
                .isInstanceOfSatisfying(EndpointAccessDeniedException.class, denied ->
                    assertThat(denied.errorCode()).isEqualTo(EndpointAccessDeniedException.TOKEN_NOT_ACCEPTED));

            Map<String, List<String>> forged = new HashMap<>(tenantCaller("actor", "CUSTOMER"));
            forged.put("x-auth-permission", List.of("app-booking:template:read"));
            assertThatThrownBy(() -> invokeTemplateStatus(dispatcher, forged))
                .isInstanceOfSatisfying(EndpointAccessDeniedException.class, denied ->
                    assertThat(denied.errorCode()).isEqualTo(EndpointAccessDeniedException.PERMISSION_DENIED));
        } finally {
            bootstrap.stop();
        }
    }

    private static Object invokeTemplateStatus(
            DefaultPluginEndpointDispatcher dispatcher,
            Map<String, List<String>> caller) {
        return dispatcher.invoke("GET", "/api/app-booking/v1/template/status", null, Map.of(), caller);
    }

    private static Map<String, List<String>> tenantCaller(String tokenRole, String tenantRoleType) {
        return Map.of(
            "x-actor-id", List.of("2001"),
            "x-tenant-id", List.of("42"),
            "x-auth-token-role", List.of(tokenRole),
            "x-auth-token-type", List.of("access"),
            "x-auth-token-scope", List.of(tokenRole),
            "x-auth-tenant-role-type", List.of(tenantRoleType),
            "x-auth-tenant-ref-id", List.of("77"));
    }

    @Test
    void requiredTenantProviderMissingFromCompositionFailsFast() {
        RuntimeShellBootstrap bootstrap = new RuntimeShellBootstrap(runtimeManager(
            registryWithHostRequiredCapabilities(),
            List.of("missing-required-plugin"),
            new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30)),
            null,
            OWNER_PERSISTENCE));

        assertThatThrownBy(bootstrap::start)
            .isInstanceOf(PluginRuntimeException.class)
            .hasMessageContaining("Required BrixPlugin provider(s) missing");
        assertThat(bootstrap.ready()).isFalse();
    }

    @Test
    void requiredPlatformAdminOperationalModuleMissingFailsFast() {
        OperationalModuleRuntimeManager manager = operationalManager(
            registryWithHostRequiredCapabilities(),
            List::of,
            List.of(PLATFORM_ADMIN_MODULE_ID));

        assertThatThrownBy(manager::prepare)
            .isInstanceOf(OperationalRuntimeException.class)
            .hasMessageContaining("Required operational provider(s) missing");
        assertThat(manager.ready()).isFalse();
    }

    @Test
    void platformAdminOperationalProviderIsServiceLoaderDiscovered() {
        var discovered = new ServiceLoaderOperationalModuleDiscovery().discover();

        assertThat(discovered)
            .anySatisfy(module -> {
                assertThat(module.descriptor().identity().moduleId()).isEqualTo(PLATFORM_ADMIN_MODULE_ID);
                assertThat(module.descriptor().endpoints().values())
                    .isNotEmpty()
                    .allSatisfy(endpoint -> assertThat(endpoint.path()).startsWith("/api/platform/"));
            });
    }

    @Test
    void identityRequiresItsOwnerPersistenceUnit() {
        RuntimeShellBootstrap bootstrap = hostBootstrap(
            new DefaultPluginEndpointDispatcher(Duration.ofSeconds(30)),
            List.of(PLATFORM_IDENTITY_PLUGIN_ID, PLATFORM_TENANT_PLUGIN_ID, APP_BOOKING_PLUGIN_ID),
            List.of(PLATFORM_AUTH_FLOW_MODULE_ID, PLATFORM_ADMIN_MODULE_ID),
            OwnerPersistenceProvider.none());

        assertThatThrownBy(bootstrap::start)
            .hasMessageContaining(PersistenceCapability.class.getName());
    }

    private static RuntimeShellBootstrap hostBootstrap(
            DefaultPluginEndpointDispatcher dispatcher,
            List<String> requiredPlugins,
            List<String> requiredOperationalModules,
            OwnerPersistenceProvider ownerPersistence) {
        DefaultCapabilityRegistry registry = registryWithHostRequiredCapabilities();
        InternalContractBinder internalContracts = new InternalContractBinder(
            registry,
            registry,
            RuntimeShellBootstrapContractTest.class.getClassLoader(),
            ownerPersistence);
        HostRuntimeOperationalView runtimeView = new HostRuntimeOperationalView(requiredModules(
            requiredPlugins,
            requiredOperationalModules));
        return new RuntimeShellBootstrap(new HostBootstrapCoordinator(
            runtimeManager(registry, requiredPlugins, dispatcher, internalContracts, ownerPersistence),
            operationalManager(
                registry,
                new ServiceLoaderOperationalModuleDiscovery()::discover,
                requiredOperationalModules,
                internalContracts,
                runtimeView),
            dispatcher,
            runtimeView,
            ignored -> { }));
    }

    private static PluginRuntimeManager runtimeManager(
            DefaultCapabilityRegistry registry,
            List<String> requiredPlugins,
            DefaultPluginEndpointDispatcher dispatcher,
            InternalContractBinder internalContracts,
            OwnerPersistenceProvider ownerPersistence) {
        return new PluginRuntimeManager(
            new ServiceLoaderPluginDiscovery()::discover,
            new ClasspathPluginRuntimeDescriptorResolver(),
            registry,
            requiredPlugins,
            dispatcher,
            ignored -> { },
            RuntimeShellBootstrapContractTest::internalContractProviders,
            internalContracts,
            ownerPersistence);
    }

    private static OperationalModuleRuntimeManager operationalManager(
            DefaultCapabilityRegistry registry,
            java.util.function.Supplier<List<ServiceLoaderOperationalModuleDiscovery.DiscoveredOperationalModule>>
                discovery,
            List<String> requiredOperationalModules) {
        return operationalManager(
            registry,
            discovery,
            requiredOperationalModules,
            new InternalContractBinder(
                registry,
                registry,
                RuntimeShellBootstrapContractTest.class.getClassLoader()),
            new HostRuntimeOperationalView(requiredOperationalModules));
    }

    private static OperationalModuleRuntimeManager operationalManager(
            DefaultCapabilityRegistry registry,
            java.util.function.Supplier<List<ServiceLoaderOperationalModuleDiscovery.DiscoveredOperationalModule>>
                discovery,
            List<String> requiredOperationalModules,
            InternalContractBinder internalContracts,
            HostRuntimeOperationalView runtimeView) {
        return new OperationalModuleRuntimeManager(
            discovery,
            RuntimeShellBootstrapContractTest::internalContractProviders,
            internalContracts,
            runtimeView,
            requiredOperationalModules,
            "3.2.0");
    }

    private static DefaultCapabilityRegistry registryWithHostRequiredCapabilities() {
        DefaultCapabilityRegistry registry = new DefaultCapabilityRegistry();
        registry.register(AuthCapability.class, new ContractAuthCapability());
        registry.register(AuthFlowCapability.class, throwingProxy(AuthFlowCapability.class));
        registry.register(EventBusCapability.class, EventBusTestFactory.allImplementations()
            .findFirst()
            .orElseThrow());
        registry.register(TenantAdministration.class, throwingProxy(TenantAdministration.class));
        registry.register(PlatformBootstrapAdministration.class, throwingProxy(PlatformBootstrapAdministration.class));
        registry.register(PlatformIdentityAdministration.class, throwingProxy(PlatformIdentityAdministration.class));
        return registry;
    }

    private static List<InternalContractProvider> internalContractProviders() {
        return new ServiceLoaderInternalContractProviderDiscovery(
            RuntimeShellBootstrapContractTest.class.getClassLoader()).discover().stream()
            .map(ServiceLoaderInternalContractProviderDiscovery.DiscoveredInternalContractProvider::provider)
            .toList();
    }

    private static List<String> requiredModules(
            List<String> requiredPlugins,
            List<String> requiredOperationalModules) {
        List<String> required = new ArrayList<>();
        required.addAll(requiredPlugins);
        required.addAll(requiredOperationalModules);
        return List.copyOf(required);
    }

    private static <T> T throwingProxy(Class<T> contractType) {
        Object proxy = Proxy.newProxyInstance(
            RuntimeShellBootstrapContractTest.class.getClassLoader(),
            new Class<?>[] {contractType},
            (target, method, args) -> {
                if (method.getDeclaringClass() == Object.class) {
                    return method.invoke(target, args);
                }
                throw new UnsupportedOperationException("Contract method is not invoked by Phase 1 bootstrap tests");
            });
        return contractType.cast(proxy);
    }

    /**
     * Owner persistence for platform-identity; Phase 1 bootstrap never reaches its repositories.
     */
    private enum ContractOwnerPersistence implements PersistenceCapability, UnitOfWork {
        INSTANCE;

        @Override
        public <R> R repository(Class<R> repositoryType) {
            throw new UnsupportedOperationException("Repositories are not used by Phase 1 bootstrap tests");
        }

        @Override
        public UnitOfWork unitOfWork() {
            return this;
        }

        @Override
        public <T> T required(Supplier<T> work) {
            return work.get();
        }

        @Override
        public <T> T readOnly(Supplier<T> work) {
            return work.get();
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
