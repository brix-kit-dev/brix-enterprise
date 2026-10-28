/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import io.brix.enterprise.app.tenant.dto.TenantDTO;
import io.brix.enterprise.app.tenant.dto.TenantMemberDTO;
import io.brix.enterprise.app.tenant.request.CreateTenantRequest;
import io.brix.enterprise.app.tenant.service.TenantManagementService;
import io.runtime.sdk.plugin.CommandHandler;
import io.runtime.sdk.plugin.EndpointHandler;
import io.runtime.sdk.plugin.EventHandler;
import io.runtime.sdk.plugin.HandlerFactory;
import io.runtime.sdk.plugin.ManagedTask;
import io.runtime.sdk.plugin.PluginBootstrapContext;
import io.runtime.sdk.plugin.QueryHandler;

/**
 * Verifies that code bindings stay aligned with the active YAML manifest.
 *
 * @author Brix Platform Team
 * @since 3.0.10
 */
class TenantPluginManifestConsistencyTest {

    private static final String ACTIVE_MANIFEST = "META-INF/brix/plugin-manifest.yaml";

    @Test
    void activeManifestDeclaresTenantPluginIdentity() {
        Map<String, Object> manifest = loadManifest();
        Map<String, Object> metadata = section(manifest, "metadata");

        assertThat(metadata.get("pluginId")).isEqualTo("brix-app-tenant");
        assertThat(metadata.get("version")).isEqualTo("3.2.0-SNAPSHOT");
    }

    @Test
    void tenantServerDoesNotShipLegacyManifestResources() {
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

        assertThat(classLoader.getResource(ACTIVE_MANIFEST)).isNotNull();
        assertThat(classLoader.getResource("META-INF/plugin-manifest.yaml")).isNull();
        assertThat(classLoader.getResource("META-INF/plugin-manifest.yml")).isNull();
        assertThat(classLoader.getResource("META-INF/plugin-manifest.json")).isNull();
    }

    @Test
    void configuredEndpointBindingsMatchManifestRouteIds() {
        RecordingBootstrapContext bootstrap = new RecordingBootstrapContext();
        TenantPlugin plugin = new TenantPlugin();
        plugin.setTenantServices(new RecordingTenantManagementService(), new ObjectMapper());
        plugin.configure(bootstrap);

        assertThat(bootstrap.endpointIds()).containsExactlyElementsOf(manifestRouteIds());
    }

    private static List<String> manifestRouteIds() {
        return sectionList(loadManifest(), "routes").stream()
            .map(route -> route.get("id"))
            .map(String.class::cast)
            .toList();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> loadManifest() {
        InputStream inputStream = Thread.currentThread().getContextClassLoader()
            .getResourceAsStream(ACTIVE_MANIFEST);
        assertThat(inputStream).as("active plugin manifest").isNotNull();
        return new Yaml().loadAs(inputStream, Map.class);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> section(Map<String, Object> manifest, String name) {
        Object value = manifest.get(name);
        assertThat(value).as(name).isInstanceOf(Map.class);
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> sectionList(Map<String, Object> manifest, String name) {
        Object value = manifest.get(name);
        assertThat(value).as(name).isInstanceOf(List.class);
        return (List<Map<String, Object>>) value;
    }

    private static final class RecordingBootstrapContext implements PluginBootstrapContext {
        private final List<String> endpointIds = new ArrayList<>();

        @Override
        public void bindEndpoint(String manifestEndpointId, EndpointHandler<?, ?> handler) {
            endpointIds.add(manifestEndpointId);
        }

        @Override
        public void bindQueryHandler(String manifestQueryId, QueryHandler<?, ?> handler) {
        }

        @Override
        public void bindCommandHandler(String manifestCommandId, CommandHandler<?> handler) {
        }

        @Override
        public void bindEventHandlerFactory(String manifestSubscriptionId, HandlerFactory<? extends EventHandler<?>> handler) {
        }

        @Override
        public void bindTask(String manifestTaskId, ManagedTask task) {
        }

        private List<String> endpointIds() {
            return endpointIds;
        }
    }

    private static final class RecordingTenantManagementService implements TenantManagementService {

        @Override
        public TenantDTO createTenant(CreateTenantRequest request) {
            return new TenantDTO();
        }

        @Override
        public TenantDTO getTenantById(Long tenantId) {
            return new TenantDTO();
        }

        @Override
        public TenantDTO getTenantByCode(String code) {
            return new TenantDTO();
        }

        @Override
        public List<TenantDTO> listTenants() {
            return List.of();
        }

        @Override
        public TenantDTO activateTenant(Long tenantId) {
            return new TenantDTO();
        }

        @Override
        public TenantDTO suspendTenant(Long tenantId) {
            return new TenantDTO();
        }

        @Override
        public List<TenantMemberDTO> listMembers(Long tenantId) {
            return List.of();
        }
    }
}
