/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.template;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ServiceLoader;

import org.junit.jupiter.api.Test;

import io.brix.enterprise.app.booking.api.BookingTemplateFeaturesResponse;
import io.brix.enterprise.app.booking.api.BookingTemplateStatusResponse;
import io.runtime.sdk.plugin.BrixPlugin;
import io.runtime.sdk.plugin.CommandHandler;
import io.runtime.sdk.plugin.EndpointHandler;
import io.runtime.sdk.plugin.EndpointInvocation;
import io.runtime.sdk.plugin.EventHandler;
import io.runtime.sdk.plugin.ManagedTask;
import io.runtime.sdk.plugin.PluginBootstrapContext;
import io.runtime.sdk.plugin.QueryHandler;

class BookingTemplatePluginTest {

    private static final String ACTIVE_MANIFEST = "META-INF/brix/plugin-manifest.yaml";

    @Test
    void serviceLoaderPublishesExactlyOneTemplateProvider() {
        List<BrixPlugin> providers = ServiceLoader.load(BrixPlugin.class).stream()
            .map(ServiceLoader.Provider::get)
            .filter(provider -> provider.getClass().getName().startsWith("io.brix.enterprise.app.booking."))
            .toList();

        assertThat(providers)
            .hasSize(1)
            .first()
            .isInstanceOf(BookingTemplatePlugin.class);
    }

    @Test
    void activeManifestUsesCurrentRuntimeShellShape() throws IOException {
        String manifest = activeManifest();

        assertThat(manifest).contains(
            "tasks:\n  provides: []",
            "internalContracts:\n  provides: []",
            "endpointId: " + BookingTemplatePlugin.STATUS_ENDPOINT_ID,
            "endpointId: " + BookingTemplatePlugin.FEATURES_ENDPOINT_ID);
        assertThat(manifest).doesNotContain(
            "accessPolicy:",
            "requires: []",
            "routes:");
    }

    @Test
    void configureBindsOnlyManifestDeclaredTemplateEndpoints() {
        RecordingBootstrapContext bootstrap = new RecordingBootstrapContext();

        new BookingTemplatePlugin().configure(bootstrap);

        assertThat(bootstrap.endpoints.keySet()).containsExactlyInAnyOrder(
            BookingTemplatePlugin.STATUS_ENDPOINT_ID,
            BookingTemplatePlugin.FEATURES_ENDPOINT_ID);
        assertThat(bootstrap.queryHandlers).isEmpty();
        assertThat(bootstrap.commandHandlers).isEmpty();
        assertThat(bootstrap.eventHandlers).isEmpty();
        assertThat(bootstrap.tasks).isEmpty();
    }

    @Test
    void statusHandlerReportsStartedRuntimeState() {
        RecordingBootstrapContext bootstrap = new RecordingBootstrapContext();
        BookingTemplatePlugin plugin = new BookingTemplatePlugin();
        plugin.configure(bootstrap);
        plugin.onStart(null);

        Object response = bootstrap.endpoints.get(BookingTemplatePlugin.STATUS_ENDPOINT_ID)
            .handle(invocation());

        assertThat(response).isInstanceOfSatisfying(BookingTemplateStatusResponse.class, status -> {
            assertThat(status.pluginId()).isEqualTo("app-booking");
            assertThat(status.runtimeStatus()).isEqualTo("STARTED");
            assertThat(status.endpointPublished()).isTrue();
            assertThat(status.features()).isEmpty();
        });
    }

    @Test
    void featuresHandlerExposesNoBusinessFeatures() {
        RecordingBootstrapContext bootstrap = new RecordingBootstrapContext();
        BookingTemplatePlugin plugin = new BookingTemplatePlugin();
        plugin.configure(bootstrap);

        Object response = bootstrap.endpoints.get(BookingTemplatePlugin.FEATURES_ENDPOINT_ID)
            .handle(invocation());

        assertThat(response).isInstanceOfSatisfying(BookingTemplateFeaturesResponse.class, features ->
            assertThat(features.features()).isEmpty());
    }

    private static String activeManifest() throws IOException {
        try (InputStream inputStream = BookingTemplatePluginTest.class.getClassLoader()
            .getResourceAsStream(ACTIVE_MANIFEST)) {
            assertThat(inputStream).as("active plugin manifest").isNotNull();
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static EndpointInvocation<Object> invocation() {
        return new EndpointInvocation<>(
            null,
            Map.of(),
            Map.of(),
            Map.of(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("trace-template-test"),
            Instant.now().plusSeconds(30));
    }

    private static final class RecordingBootstrapContext implements PluginBootstrapContext {

        private final Map<String, EndpointHandler<EndpointInvocation<Object>, Object>> endpoints =
            new LinkedHashMap<>();
        private final Map<String, Object> queryHandlers = new LinkedHashMap<>();
        private final Map<String, Object> commandHandlers = new LinkedHashMap<>();
        private final Map<String, Object> eventHandlers = new LinkedHashMap<>();
        private final Map<String, Object> tasks = new LinkedHashMap<>();

        @SuppressWarnings("unchecked")
        @Override
        public void bindEndpoint(String manifestEndpointId, EndpointHandler<?, ?> handler) {
            endpoints.put(
                manifestEndpointId,
                (EndpointHandler<EndpointInvocation<Object>, Object>) handler);
        }

        @Override
        public void bindQueryHandler(String manifestQueryId, QueryHandler<?, ?> handler) {
            queryHandlers.put(manifestQueryId, handler);
            fail("app-booking template must not bind query handlers");
        }

        @Override
        public void bindCommandHandler(String manifestCommandId, CommandHandler<?> handler) {
            commandHandlers.put(manifestCommandId, handler);
            fail("app-booking template must not bind command handlers");
        }

        @Override
        public void bindEventHandler(String manifestSubscriptionId, EventHandler<?> handler) {
            eventHandlers.put(manifestSubscriptionId, handler);
            fail("app-booking template must not bind event handlers");
        }

        @Override
        public void bindTask(String manifestTaskId, ManagedTask task) {
            tasks.put(manifestTaskId, task);
            fail("app-booking template must not bind tasks");
        }
    }
}
